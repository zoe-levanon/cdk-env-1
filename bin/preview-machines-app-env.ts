#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PreviewMachinesEnvStack } from '../lib/preview-machines-env-stack';

process.env.CDK_DEFAULT_REGION = process.env.CDK_DEFAULT_REGION || 'us-east-1';

if (!process.env.CDK_DEFAULT_ACCOUNT) {
    throw new Error('CDK_DEFAULT_ACCOUNT environment variable is not set, please set it before running cdk to the 12 digit account ID you want to deploy on');
}

if (!process.env.CDK_EC2_KEY_PAIR_NAME) {
    throw new Error('CDK_EC2_KEY_PAIR_NAME environment variable is not set, please set it before running cdk to the a key pair THAT YOU KEEP, and have already created in the console:\n\t'
        + `https://us-east-1.console.aws.amazon.com/ec2/home?region=${process.env.CDK_DEFAULT_REGION}#KeyPairs:`);
}

const app = new cdk.App();
new PreviewMachinesEnvStack(app, 'CdkPreviewMachinesEnvStack', {

    /* If you don't specify 'env', this stack will be environment-agnostic.
     * Account/Region-dependent features and context lookups will not work,
     * but a single synthesized template can be deployed anywhere. */
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },

    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});