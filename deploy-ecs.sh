#!/bin/bash
set -e

# Store your VPC ID and subnet IDs
VPC_ID=vpc-0eb584503be02ff7d
SUBNET_1=subnet-086d535f55eecd338
SUBNET_2=subnet-0dca6d6769d1c726c

# Get security group IDs
LB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=mpp-hw-lb-sg" --query "SecurityGroups[0].GroupId" --output text)
CONTAINER_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=mpp-hw-container-sg" --query "SecurityGroups[0].GroupId" --output text)

echo "Creating load balancer..."
aws elbv2 create-load-balancer --name mpp-hw-lb --subnets $SUBNET_1 $SUBNET_2 --security-groups $LB_SG_ID

echo "Creating target group..."
aws elbv2 create-target-group --name mpp-hw-tg --protocol HTTP --port 3000 --vpc-id $VPC_ID --target-type ip --health-check-path "/api/health" --health-check-interval-seconds 30

echo "Getting ARNs..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names mpp-hw-lb --query 'LoadBalancers[0].LoadBalancerArn' --output text)
TG_ARN=$(aws elbv2 describe-target-groups --names mpp-hw-tg --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "Creating listener..."
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TG_ARN

echo "Creating ECS service..."
aws ecs create-service \
  --cluster mpp-hw-cluster \
  --service-name mpp-hw-service \
  --task-definition mpp-hw \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$CONTAINER_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=app,containerPort=3000"

echo "Getting load balancer DNS name..."
ALB_DNS=$(aws elbv2 describe-load-balancers --names mpp-hw-lb --query 'LoadBalancers[0].DNSName' --output text)
echo "Your application will be available at: http://$ALB_DNS"