#!/bin/bash
set -e

AWS_CLI="${AWS_CLI:-/usr/local/bin/aws}"
AWS_REGION="eu-central-1"
STACK_NAME="LoppestarsEcsStack"
ACCOUNT_ID="035338517878"

echo "🚀 Direct CloudFormation Deployment (Bypassing CDK)"
echo ""

# Load environment variables
if [ -f "../.env" ]; then
  export $(cat ../.env | grep -v '^#' | xargs)
  echo "✅ Loaded environment variables"
else
  echo "❌ .env file not found"
  exit 1
fi

echo ""
echo "📋 Creating CloudFormation template..."

cat > stack-template.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Loppestars ECS Fargate Stack with ALB'

Parameters:
  SupabaseUrl:
    Type: String
    NoEcho: true
  SupabaseServiceRoleKey:
    Type: String
    NoEcho: true
  SourceBucket:
    Type: String
    Default: 'stall-photos'
  StorageBucket:
    Type: String
    Default: 'stall-photos-processed'
  DomainName:
    Type: String
    Default: 'loppestars.spoons.dk'

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: LoppestarsVPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.0.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet2

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: LoppestarsIGW

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PublicRouteTable

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  SubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Group for ALB
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0

  # Security Group for ECS Tasks
  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: LoppestarsCluster

  # CloudWatch Log Group
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /ecs/loppestars
      RetentionInDays: 7

  # IAM Roles
  TaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt LogGroup.Arn

  TaskRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole

  # Application Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: loppestars-alb
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: loppestars-tg
      Port: 8080
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  # HTTP Listener (redirect to HTTPS)
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref LoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301

  # HTTPS Listener (manual certificate needed)
  # Note: You'll need to manually create/import a certificate and add the HTTPS listener

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt LoadBalancer.DNSName
    Export:
      Name: LoppestarsLoadBalancerDNS

  ClusterName:
    Description: ECS Cluster Name
    Value: !Ref ECSCluster
    Export:
      Name: LoppestarsClusterName

  TaskExecutionRoleArn:
    Description: Task Execution Role ARN
    Value: !GetAtt TaskExecutionRole.Arn
    Export:
      Name: LoppestarsTaskExecutionRoleArn

  TaskRoleArn:
    Description: Task Role ARN
    Value: !GetAtt TaskRole.Arn
    Export:
      Name: LoppestarsTaskRoleArn

  LogGroupName:
    Description: CloudWatch Log Group
    Value: !Ref LogGroup
    Export:
      Name: LoppestarsLogGroupName

  TargetGroupArn:
    Description: Target Group ARN
    Value: !Ref TargetGroup
    Export:
      Name: LoppestarsTargetGroupArn

  ECSSecurityGroupId:
    Description: ECS Security Group ID
    Value: !Ref ECSSecurityGroup
    Export:
      Name: LoppestarsECSSecurityGroupId

  SubnetIds:
    Description: Subnet IDs for ECS tasks
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: LoppestarsSubnetIds
EOF

echo "✅ Template created"
echo ""
echo "🚀 Deploying stack to CloudFormation..."
echo ""

$AWS_CLI cloudformation deploy \
  --template-file stack-template.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    SupabaseUrl="$SUPABASE_URL" \
    SupabaseServiceRoleKey="$SUPABASE_SERVICE_ROLE_KEY" \
    SourceBucket="${SOURCE_BUCKET:-stall-photos}" \
    StorageBucket="${STORAGE_BUCKET:-stall-photos-processed}" \
    DomainName="${ECS_DOMAIN:-loppestars.spoons.dk}" \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION \
  --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
  echo ""
  echo "============================================================"
  echo "✅ Infrastructure Deployed!"
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
  echo "⚠️  IMPORTANT: This creates the base infrastructure only."
  echo "You still need to:"
  echo "1. Deploy the Docker container to ECS"
  echo "2. Set up SSL certificate"
  echo "3. Configure DNS"
else
  echo "❌ Deployment failed"
  exit 1
fi
