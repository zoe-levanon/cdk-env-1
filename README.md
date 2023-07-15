# Welcome to your CDK TypeScript project

## What is this
This is a CDK project that uses code to generate a CloudFormation stack.<br>
This stack contains a suite of services:
- vpc - network where all your services are deployed
- security group - to control access to your services
- asg - an Auto Scaling Group to start/stop your EC2 instances
- load balancer - to direct traffic to the EC2 instances

## Getting started
- Clone the repo
- Run `npm install`
  - I used node18 locally, but it should probably work with node 14 or later
  - I strongly recommend installing nvm and using it to install node. Never tried it on mac but it should probably be something like:
    - `brew install nvm`
    - nvm install node 18.16.1
- Go to your AWS console and generate a KeyPair to use when opening an ssh connection to the EC2 instance:
  - https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#KeyPairs:
  - Be sure to download and save the key pair in a safe place.
- Make sure you have AWS credentials configured on your machine (see https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
  - A good way to test aws credentials is by opening cmd/terminal and running `aws sts get-caller-identity` or `aws s3 ls`
- Set the following environment variables before running:
  - CDK_DEFAULT_REGION=us-east-1
  - CDK_DEFAULT_ACCOUNT=<your AWS account number (12 digits)>
  - CDK_EC2_KEY_PAIR_NAME=<the name of the key you defined in the step above>
- Before the first time you can deploy this you'll need to setup CDK on your account:
  - run `cdk bootstrap` (this will create a bucket in your account that will be used to store CDK assets)
- To deploy the entire stack run `cdk deploy`
  - This will create the full stack of services in your account, and have the ASG launch a single EC2 instance


## Accessing your EC2 machine
- Go to your AWS console and find the EC2 instance that was created by the ASG. You can do that in two ways:
  1. EC2 instance console: https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Instances:sort=instanceId
  2. Via ASG:
     1. Go to the [ASG Service](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#AutoScalingGroups:) 
     2. Select your ASG
     3. Go to the Instances tab and click the instance you want to use
- Copy the public IP of the instance and open a terminal to it. You will need to provide the key file on your machine.
- See instructions in the "Connect" tab of the EC2 instance console for more details

## Useful commands
The `cdk.json` file tells the CDK Toolkit how to execute your app.

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


