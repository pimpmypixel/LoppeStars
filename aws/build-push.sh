#!/bin/bash

# Path to the parent folder .env
ENV_FILE="../.env"

# Load environment variables
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "$ENV_FILE not found!"
  exit 1
fi

# Build from parent directory where Dockerfile is located
cd .. || exit 1
echo "Building Docker image from $(pwd)..."

docker build -t loppestars .
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 035338517878.dkr.ecr.eu-central-1.amazonaws.com | cat
docker tag loppestars:latest 035338517878.dkr.ecr.eu-central-1.amazonaws.com/cdk-hnb659fds-container-assets-035338517878-eu-central-1:latest
docker push 035338517878.dkr.ecr.eu-central-1.amazonaws.com/cdk-hnb659fds-container-assets-035338517878-eu-central-1:latest
echo "Docker image pushed to ECR."

aws ecs register-task-definition \
  --family loppestars \
  --container-definitions '[
    {
      "name": "loppestars-task-definition",
      "image": "035338517878.dkr.ecr.eu-central-1.amazonaws.com/loppestars:latest",
      "memory": 512,
      "cpu": 256,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "hostPort": 8080
        }
      ],
      "environment": [
        {"name": "SUPABASE_URL", "value": "$SUPABASE_URL"},
        {"name": "SUPABASE_SERVICE_ROLE_KEY", "value": "$SUPABASE_SERVICE_ROLE_KEY"},
        {"name": "SUPABASE_ANON_KEY", "value": "$SUPABASE_ANON_KEY"},
        {"name": "SOURCE_BUCKET", "value": "$SOURCE_BUCKET"},
        {"name": "STORAGE_BUCKET", "value": "$STORAGE_BUCKET"}
      ]
    }
  ]' | cat

CLUSTER=$(aws ecs list-clusters --query "clusterArns[]" --output text | cat | awk -F/ '{print $NF}')
SERVICE=$(aws ecs list-services --cluster $CLUSTER --query "serviceArns[]" --output text | cat | awk -F/ '{print $NF}')

aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition loppestars-task-definition \
  --force-new-deployment | cat

echo ""
echo "Waiting for deployment to stabilize..."
aws ecs wait services-stable --cluster $CLUSTER --services $SERVICE | cat

echo ""
echo "=== Verifying Deployment ==="

# Get the current running task
RUNNING_TASK=$(aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE --query "taskArns[0]" --output text | cat)
echo "Running task: $RUNNING_TASK"

# Get task details including image
TASK_DETAILS=$(aws ecs describe-tasks --cluster $CLUSTER --tasks $RUNNING_TASK --query "tasks[0].containers[0]" | cat)
RUNNING_IMAGE=$(echo "$TASK_DETAILS" | grep -o '"image": "[^"]*"' | cut -d'"' -f4)
echo "Running image: $RUNNING_IMAGE"

# Get the latest ECR image digest
LATEST_DIGEST=$(aws ecr describe-images \
  --repository-name cdk-hnb659fds-container-assets-035338517878-eu-central-1 \
  --image-ids imageTag=latest \
  --query 'imageDetails[0].imageDigest' \
  --output text | cat)
echo "Latest ECR digest: $LATEST_DIGEST"

# Get the running task's image digest
RUNNING_DIGEST=$(echo "$TASK_DETAILS" | grep -o '"imageDigest": "[^"]*"' | cut -d'"' -f4)
echo "Running task digest: $RUNNING_DIGEST"

echo ""
if [ "$LATEST_DIGEST" = "$RUNNING_DIGEST" ]; then
  echo "✅ SUCCESS: ECS service is running the latest Docker image!"
  echo "✅ Latest changes are LIVE!"
else
  echo "⚠️  WARNING: Digest mismatch. Deployment may still be in progress."
  echo "   Please wait a moment and check the ECS console."
fi

echo ""
echo "=== Deployment Summary ==="
echo "Cluster: $CLUSTER"
echo "Service: $SERVICE"
echo "Task Definition: loppestars-task-definition"
echo "Image: 035338517878.dkr.ecr.eu-central-1.amazonaws.com/loppestars:latest"
  
echo ""
echo "Deployment complete."