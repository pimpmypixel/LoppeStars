import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecspatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { config } from 'dotenv';

// Load environment variables from root .env file
config({ path: '../.env' });

export class LoppestarsEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC (simple, 2 AZs)
    const vpc = new ec2.Vpc(this, "Vpc", { maxAzs: 2 });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    // Create a DNS-validated ACM certificate (DNS hosted in Cloudflare)
    const cfnCert = new acm.CfnCertificate(this, 'LoadBalancerCfnCert', {
      domainName: process.env.ECS_DOMAIN!,
      validationMethod: 'DNS',
    });
    // Import the generated certificate ARN for use in ALB
    const certificate = acm.Certificate.fromCertificateArn(this, 'LoadBalancerCert', cfnCert.ref);
    // Export Certificate ARN for external automation
    new cdk.CfnOutput(this, 'CertificateArn', {
      value: cfnCert.ref,
    });

    // Fargate + ALB
    const fargateService = new ecspatterns.ApplicationLoadBalancedFargateService(this, "Service", {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      publicLoadBalancer: true,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      listenerPort: 443,
      redirectHTTP: true,
      certificate: certificate,
      assignPublicIp: true,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset("..", {
          file: "Dockerfile",
        }),
        containerName: "web",
        containerPort: 8080,
        environment: {
          SUPABASE_URL: process.env.SUPABASE_URL!,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
          SOURCE_BUCKET: process.env.SOURCE_BUCKET || "stall-photos",
          STORAGE_BUCKET: process.env.STORAGE_BUCKET || "stall-photos-processed",
        },
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: "loppestars",
          logRetention: logs.RetentionDays.ONE_WEEK,
        }),
      },
    });

    // Configure health check for target group
    fargateService.targetGroup.configureHealthCheck({
      path: "/health",
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
  }
}