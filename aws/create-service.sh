#!/bin/bash
set -e

AWS_CLI="/usr/local/bin/aws"
REGION="eu-central-1"
STACK_NAME="LoppestarsEcsStack"

echo "🚀 Creating ECS Service and Task Definition"
echo ""

# Get stack outputs
echo "📋 Getting stack outputs..."
CLUSTER_NAME=$($AWS_CLI cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' \
  --output text)

TARGET_GROUP_ARN=$($AWS_CLI cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`TargetGroupArn`].OutputValue' \
  --output text)

TASK_EXEC_ROLE=$($AWS_CLI cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`TaskExecutionRoleArn`].OutputValue' \
  --output text)

TASK_ROLE=$($AWS_CLI cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`TaskRoleArn`].OutputValue' \
  --output text)

LOG_GROUP=$($AWS_CLI cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`LogGroupName`].OutputValue' \
  --output text)

SUBNETS=$($AWS_CLI cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`SubnetIds`].OutputValue' \
  --output text)

SECURITY_GROUP=$($AWS_CLI cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSSecurityGroupId`].OutputValue' \
  --output text)

echo "✅ Cluster: $CLUSTER_NAME"
echo "✅ Target Group: $TARGET_GROUP_ARN"
echo "✅ Subnets: $SUBNETS"
echo "✅ Security Group: $SECURITY_GROUP"

# Load environment variables
source ../.env

# Build and push Docker image
echo ""
echo "🐳 Building Docker image..."
ACCOUNT_ID="035338517878"
ECR_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/loppestars"
IMAGE_TAG=$(git rev-parse --short HEAD)

# Login to ECR
$AWS_CLI ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Create ECR repository if it doesn't exist
$AWS_CLI ecr describe-repositories --repository-names loppestars --region $REGION 2>/dev/null || \
  $AWS_CLI ecr create-repository --repository-name loppestars --region $REGION

# Build and push
cd ..
docker build -t loppestars:$IMAGE_TAG \
  --build-arg SUPABASE_URL=$SUPABASE_URL \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  --build-arg SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  --build-arg SOURCE_BUCKET=stall-photos \
  --build-arg STORAGE_BUCKET=stall-photos-processed \
  -f Dockerfile .

docker tag loppestars:$IMAGE_TAG $ECR_REPO:$IMAGE_TAG
docker tag loppestars:$IMAGE_TAG $ECR_REPO:latest
docker push $ECR_REPO:$IMAGE_TAG
docker push $ECR_REPO:latest

echo "✅ Image pushed: $ECR_REPO:$IMAGE_TAG"

# Register task definition
echo ""
echo "📝 Registering task definition..."

cat > /tmp/task-def.json <<EOF
{
  "family": "loppestars",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$TASK_EXEC_ROLE",
  "taskRoleArn": "$TASK_ROLE",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "$ECR_REPO:$IMAGE_TAG",
      "cpu": 256,
      "memory": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "SUPABASE_URL", "value": "$SUPABASE_URL"},
        {"name": "SUPABASE_SERVICE_ROLE_KEY", "value": "$SUPABASE_SERVICE_ROLE_KEY"},
        {"name": "SUPABASE_ANON_KEY", "value": "$SUPABASE_ANON_KEY"},
        {"name": "SOURCE_BUCKET", "value": "stall-photos"},
        {"name": "STORAGE_BUCKET", "value": "stall-photos-processed"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "$LOG_GROUP",
          "awslogs-region": "$REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

TASK_DEF_ARN=$($AWS_CLI ecs register-task-definition \
  --cli-input-json file:///tmp/task-def.json \
  --region $REGION \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "✅ Task definition: $TASK_DEF_ARN"

# Create ECS service
echo ""
echo "🔧 Creating ECS service..."

$AWS_CLI ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name loppestars-service \
  --task-definition $TASK_DEF_ARN \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=web,containerPort=8080" \
  --health-check-grace-period-seconds 60 \
  --region $REGION

echo ""
echo "============================================================"
echo "✅ ECS Service Created!"
echo "============================================================"
echo ""
echo "Waiting for task to start (this may take 2-3 minutes)..."
echo ""

sleep 10

# Wait for service to stabilize
$AWS_CLI ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services loppestars-service \
  --region $REGION

echo "✅ Service is stable!"
echo ""
echo "Load Balancer DNS: $(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text)"
echo ""
echo "Update Cloudflare DNS to point to this ALB!"
