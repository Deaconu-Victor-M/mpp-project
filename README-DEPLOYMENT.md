# Deployment Guide for Amazon ECS

This guide will walk you through deploying your Next.js application to Amazon ECS using Docker Compose.

## Prerequisites

1. An AWS account with appropriate permissions
2. AWS CLI installed and configured
3. Docker installed on your local machine
4. GitHub account (if using GitHub Actions for CI/CD)

## Local Setup & Testing

1. **Set up environment variables**

   Create a `.env` file with the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

2. **Test locally with Docker Compose**

   ```bash
   # Build and run the container
   docker compose up --build
   ```

   Visit http://localhost:3000 to verify your app works correctly.

## AWS Setup

1. **Create an ECR Repository**

   ```bash
   aws ecr create-repository --repository-name mpp-hw --region eu-central-1
   ```

2. **Create IAM Roles**

   Create two IAM roles:
   
   - **ecsTaskExecutionRole** - Allows ECS to pull from ECR and read secrets
   - **ecsTaskRole** - Gives your app permissions to access other AWS services

   For the execution role, attach these policies:
   - `AmazonECR-ReadOnly`
   - `AmazonSSMReadOnlyAccess`
   - `CloudWatchLogsFullAccess`

3. **Store Secrets in Parameter Store**

   ```bash
   aws ssm put-parameter --name "/mpp-hw/NEXT_PUBLIC_SUPABASE_URL" --value "your-value" --type SecureString --region eu-central-1
   aws ssm put-parameter --name "/mpp-hw/NEXT_PUBLIC_SUPABASE_ANON_KEY" --value "your-value" --type SecureString --region eu-central-1
   aws ssm put-parameter --name "/mpp-hw/SUPABASE_SERVICE_ROLE_KEY" --value "your-value" --type SecureString --region eu-central-1
   ```

4. **Create CloudWatch Log Group**

   ```bash
   aws logs create-log-group --log-group-name /ecs/mpp-hw --region eu-central-1
   ```

5. **Create ECS Cluster**

   ```bash
   aws ecs create-cluster --cluster-name mpp-hw-cluster --region eu-central-1
   ```

## Infrastructure Setup

There are two ways to set up the remaining infrastructure:

### Option 1: Manual Setup

1. **Create a VPC, subnets, and security groups**

   Use the AWS Console or CloudFormation to create:
   - A VPC with public and private subnets
   - Security groups for the load balancer and containers

2. **Create an Application Load Balancer**

   Create an ALB in the public subnets with a target group for port 3000.

3. **Create an ECS service manually**

   In the ECS console, create a service using the task definition.
   
### Option 2: Using AWS CLI with CloudFormation

1. **Create a CloudFormation stack using the provided template**

   ```bash
   aws cloudformation deploy \
     --template-file ecs-infrastructure.yaml \
     --stack-name mpp-hw-infrastructure \
     --capabilities CAPABILITY_IAM \
     --region eu-central-1
   ```

## CI/CD Setup

1. **Add GitHub Secrets**

   In your GitHub repository settings, add these secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. **Push to GitHub**

   Once you push your code to the main branch, the GitHub Actions workflow will:
   - Build the Docker image
   - Push it to ECR
   - Update the task definition
   - Deploy the new version to ECS

## Manual Deployment (Without CI/CD)

If you prefer to deploy manually:

1. **Login to ECR**

   ```bash
   aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com
   ```

2. **Build and push the image**

   ```bash
   export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
   export AWS_REGION=eu-central-1
   export IMAGE_TAG=$(git rev-parse --short HEAD)
   
   docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mpp-hw:$IMAGE_TAG .
   docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mpp-hw:$IMAGE_TAG
   ```

3. **Register and deploy the task definition**

   ```bash
   # Update the task definition
   envsubst < task-definition.json > task-definition-updated.json
   
   # Register the task definition
   aws ecs register-task-definition --cli-input-json file://task-definition-updated.json --region $AWS_REGION
   
   # Deploy to ECS
   aws ecs update-service --cluster mpp-hw-cluster --service mpp-hw-service --task-definition mpp-hw --region $AWS_REGION
   ```

## Adding a Custom Domain

1. **Register a domain** (using Route 53 or another registrar)

2. **Create a certificate in ACM**

   ```bash
   aws acm request-certificate --domain-name your-domain.com --validation-method DNS --region eu-central-1
   ```

3. **Add the certificate to your load balancer**

4. **Create a DNS record** pointing to your load balancer

   If using Route 53:
   ```bash
   aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch file://dns-change.json
   ```

## Troubleshooting

1. **Check container logs**

   ```bash
   aws logs get-log-events --log-group-name /ecs/mpp-hw --log-stream-name PREFIX/app/TASK_ID --region eu-central-1
   ```

2. **Check ECS service events**

   ```bash
   aws ecs describe-services --cluster mpp-hw-cluster --services mpp-hw-service --region eu-central-1
   ```

3. **SSH into the container** (for debugging)

   Use AWS ECS Exec:
   ```bash
   aws ecs execute-command --cluster mpp-hw-cluster --task TASK_ID --container app --interactive --command "/bin/sh" --region eu-central-1
   ``` 