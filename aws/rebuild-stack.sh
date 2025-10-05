#!/bin/bash
set -e

STACK_NAME="LoppestarsEcsStack"
AWS_REGION="eu-central-1"

echo "🔍 Checking stack deletion status..."

# Wait for stack to be deleted
while true; do
  STATUS=$(${AWS_CLI:-/usr/local/bin/aws} cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].StackStatus' \
    --output text 2>&1 || echo "DELETED")
  
  if [[ "$STATUS" == *"does not exist"* ]] || [[ "$STATUS" == "DELETED" ]]; then
    echo "✅ Stack has been deleted!"
    break
  elif [[ "$STATUS" == "DELETE_FAILED" ]]; then
    echo "❌ Stack deletion failed!"
    echo "Check the CloudFormation console for details:"
    echo "https://eu-central-1.console.aws.amazon.com/cloudformation/home?region=eu-central-1"
    exit 1
  else
    echo "⏳ Stack status: $STATUS - waiting 30 seconds..."
    sleep 30
  fi
done

echo ""
echo "🚀 Starting fresh CDK deployment..."
echo ""

# Bootstrap CDK if needed (safe to run multiple times)
echo "📦 Bootstrapping CDK..."
npx cdk bootstrap aws://035338517878/eu-central-1 --region eu-central-1

echo ""
echo "🏗️  Deploying CDK stack..."
echo ""

# Deploy the stack
npx cdk deploy --region eu-central-1 --require-approval never

echo ""
echo "============================================================"
echo "✅ CDK Stack Deployment Complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "1. Get the Load Balancer DNS from CDK outputs"
echo "2. Update Cloudflare DNS CNAME for loppestars.spoons.dk"
echo "3. Wait for DNS propagation"
echo "4. Test the API: curl https://loppestars.spoons.dk/health"
echo ""
echo "To view stack outputs:"
echo "aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query 'Stacks[0].Outputs'"
echo ""
echo "============================================================"
