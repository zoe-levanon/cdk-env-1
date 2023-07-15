# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


## Getting starting
- Clone the repo
- Run `npm install` (use node 18 if possible, and I highly recommend installing nvm if you don't use it to manage node versions)
- Set environment variables:
  - CDK_REGION=us-east-1
  - CDK_ACCOUNT=<your AWS account number (12 digits)>
- Make sure you have AWS credentials configured on your machine (see https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
  - I always find that the best way to test them is by opening cmd/terminal and running `aws sts get-caller-identity` or `aws s3 ls` 
- Before the first time you can deploy this you'll need to setup CDK on your account:
  - run `cdk bootstrap` (this will create a bucket in your account that will be used to store CDK assets)
- To create the CDK json (but not deploy it) run `cdk synth` (this is optional) 
- To deploy the entire stack run `cdk deploy` 