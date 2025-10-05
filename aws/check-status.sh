#!/bin/bash

STACK_NAME="LoppestarsEcsStack"
AWS_REGION="eu-central-1"

echo "🔍 Checking CDK Stack Status..."
echo ""

STATUS=$(${AWS_CLI:-/usr/local/bin/aws} cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  --query 'Stacks[0].StackStatus' \
  --output text 2>&1 || echo "DELETED")

if [[ "$STATUS" == *"does not exist"* ]] || [[ "$STATUS" == "DELETED" ]]; then
  echo "✅ Stack has been DELETED - Ready to rebuild!"
  echo ""
  echo "Run the rebuild script:"
  echo "  cd aws && ./rebuild-stack.sh"
elif [[ "$STATUS" == "DELETE_IN_PROGRESS" ]]; then
  echo "⏳ Stack is being DELETED..."
  echo ""
  echo "Recent deletion events:"
  ${AWS_CLI:-/usr/local/bin/aws} cloudformation describe-stack-events \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --max-items 5 \
    --query 'StackEvents[*].[Timestamp,ResourceStatus,LogicalResourceId]' \
    --output table 2>&1 | cat
elif [[ "$STATUS" == "DELETE_FAILED" ]]; then
  echo "❌ Stack deletion FAILED!"
  echo ""
  echo "Check the console for details:"
  echo "https://eu-central-1.console.aws.amazon.com/cloudformation/home?region=eu-central-1"
else
  echo "📊 Stack Status: $STATUS"
fi

echo ""
