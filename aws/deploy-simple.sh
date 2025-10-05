#!/bin/bash
set -e

STACK_NAME="LoppestarsEcsStack"
AWS_REGION="eu-central-1"
AWS_CLI="${AWS_CLI:-/usr/local/bin/aws}"

echo "🚀 Simple CDK Deployment Script"
echo ""

# Check if stack exists
echo "Checking if stack exists..."
STACK_EXISTS=$($AWS_CLI cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].StackName' \
  --output text 2>&1 || echo "NOT_FOUND")

if [[ "$STACK_EXISTS" == "NOT_FOUND" ]] || [[ "$STACK_EXISTS" == *"does not exist"* ]]; then
  echo "✅ No existing stack found, ready for fresh deployment"
else
  echo "⚠️  Stack exists with status:"
  $AWS_CLI cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].StackStatus' \
    --output text
fi

echo ""
echo "📦 Installing CDK dependencies..."
npm install --silent

echo ""
echo "🏗️  Deploying stack (this takes 10-15 minutes)..."
echo ""

# Use direct cdk command without npx to avoid issues
export AWS_REGION=$AWS_REGION
export CDK_DEFAULT_REGION=$AWS_REGION
export CDK_DEFAULT_ACCOUNT=035338517878

# Deploy with minimal interaction
./node_modules/.bin/cdk deploy \
  --require-approval never \
  --ci \
  --progress events \
  --region $AWS_REGION 2>&1

DEPLOY_EXIT=$?

if [ $DEPLOY_EXIT -eq 0 ]; then
  echo ""
  echo "============================================================"
  echo "✅ Deployment Complete!"
  echo "============================================================"
  echo ""
  
  # Get outputs
  echo "Stack Outputs:"
  $AWS_CLI cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table
  
  echo ""
  echo "Next: Update Cloudflare DNS with the LoadBalancerDNS value above"
else
  echo ""
  echo "❌ Deployment failed with exit code $DEPLOY_EXIT"
  exit 1
fi
