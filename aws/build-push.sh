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

docker build -t loppestars .
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 035338517878.dkr.ecr.eu-central-1.amazonaws.com
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
  ]'

CLUSTER=$(aws ecs list-clusters --query "clusterArns[]" --output text | awk -F/ '{print $NF}')
SERVICE=$(aws ecs list-services --cluster $CLUSTER --query "serviceArns[]" --output text | awk -F/ '{print $NF}')

aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition loppestars-task-definition \
  --force-new-deployment
  
echo "Deployment complete."