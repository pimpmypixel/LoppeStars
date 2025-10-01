import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecspatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import 'dotenv/config';

const config = require('dotenv').config({ path: '../.env' });

export class LoppestarsEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC (simple, 2 AZs)
    const vpc = new ec2.Vpc(this, "Vpc", { maxAzs: 2 });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    // Fargate + ALB
    const fargateService = new ecspatterns.ApplicationLoadBalancedFargateService(this, "Service", {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      publicLoadBalancer: true,
      assignPublicIp: true,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(".", {
          file: "Dockerfile",
        }),
        containerPort: 8080,
        environment: {
          SUPABASE_URL: process.env.SUPABASE_URL!,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
          SOURCE_BUCKET: process.env.SOURCE_BUCKET || "stall-photos",
          STORAGE_BUCKET: process.env.STORAGE_BUCKET || "stall-photos-processed",
        },
      },
    });

    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
  }
}
