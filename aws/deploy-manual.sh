#!/bin/bash
set -e

AWS_CLI="${AWS_CLI:-/usr/local/bin/aws}"
AWS_REGION="eu-central-1"
STACK_NAME="LoppestarsEcsStack"

echo "🚀 Direct CloudFormation Deployment"
echo ""

# First, check if we need to build/push an image manually
echo "Step 1: Build and push Docker image to ECR..."
cd /Users/andreas/Herd/loppestars

# Get ECR repo
ECR_REPO="cdk-hnb659fds-container-assets-035338517878-eu-central-1"
ECR_URI="035338517878.dkr.ecr.eu-central-1.amazonaws.com/${ECR_REPO}"
IMAGE_TAG="manual-$(date +%s)"

echo "Logging into ECR..."
$AWS_CLI ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URI

echo "Building Docker image..."
docker build -t ${ECR_URI}:${IMAGE_TAG} \
  --build-arg SUPABASE_URL="$SUPABASE_URL" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --build-arg SOURCE_BUCKET="stall-photos" \
  --build-arg STORAGE_BUCKET="stall-photos-processed" \
  -f Dockerfile .

echo "Pushing image to ECR..."
docker push ${ECR_URI}:${IMAGE_TAG}

echo "✅ Image pushed: ${ECR_URI}:${IMAGE_TAG}"
echo ""

echo "Step 2: Deploy CDK stack..."
cd aws

# Export env vars for CDK
export AWS_REGION=$AWS_REGION
export CDK_DEFAULT_REGION=$AWS_REGION  
export CDK_DEFAULT_ACCOUNT=035338517878

# Try deploying with --exclusively to avoid asset building
./node_modules/.bin/cdk deploy \
  --require-approval never \
  --ci true \
  --progress events \
  --outputs-file outputs.json

echo ""
echo "✅ Deployment complete!"
echo ""

if [ -f outputs.json ]; then
  echo "Stack outputs:"
  cat outputs.json
fi
