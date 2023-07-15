import * as cdk from 'aws-cdk-lib';
import { aws_autoscaling as asg, aws_ec2 as ec2, aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";

/*
const initScript = `
          #!/bin/bash
          # Install SSM agent (for easier access via AWS Session Manager)
          yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
          sudo systemctl enable amazon-ssm-agent
          sudo systemctl start amazon-ssm-agent          
          yum install -y epel-release
          
          # Install ffmpeg
          yum install -y ffmpeg
        `;*/

export class CdkAppEnvStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create a VPC with multiple
        const vpc = new ec2.Vpc(this, 'MainVPC', {
            maxAzs: 6
        });

        const sg1 = new ec2.SecurityGroup(this, 'SecurityGroup-preview-machines', {
            vpc: vpc,
        });


        const multipartUserData = new ec2.MultipartUserData();
        const commandsUserData = ec2.UserData.forLinux();
        multipartUserData.addUserDataPart(commandsUserData, ec2.MultipartBody.SHELL_SCRIPT, true);
        multipartUserData.addCommands('yum install -y ffmpeg');

        // Create the LaunchTemplate (this is used when launching a new EC2 instance)
        const lt = new ec2.LaunchTemplate(this, 'LaunchTemplate-PreviewMachines', {
            launchTemplateName: 'LaunchTemplate-PreviewMachines',
            machineImage: new ec2.AmazonLinux2023ImageSsmParameter(),
            // Instance type - notice that this is a Graviton2 instance type, so when we install software, it has to match the ARM architecture, and not intel
            instanceType: InstanceType.of(InstanceClass.C7G, InstanceSize.LARGE),
            userData: multipartUserData
        });

        // Create the load balancer in the VPC, with access to the web.
        const lb = new elbv2.ApplicationLoadBalancer(this, 'LB-PreviewMachines', {
            vpc,
            internetFacing: true
        });

        // Add a listener and open up the load balancer's security group to the world.
        const listener = lb.addListener('Listener-PreviewMachines-80', {
            port: 80,
            // 'open: true' is the default, you can leave it out if you want. Set it
            // to 'false' and use `listener.connections` if you want to be selective
            // about who can access the load balancer.
            open: true,
        });


        const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup-PreviewMachines', {
            vpc,
            port: 80
        });
        listener.addTargetGroups('TargetGroup-PreviewMachines', {
            targetGroups: [targetGroup]
        });


        // Create an auto scaling group, and attach it to the load balancer's target group.
        const autoScalingGroup = new asg.AutoScalingGroup(this, 'ASG-PreviewMachines', {
            vpc,
            desiredCapacity: 1,
            launchTemplate: lt
        });

        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

        // Setup auto-scaling schedule
        autoScalingGroup.scaleOnSchedule('ScaleDown', {
            schedule: asg.Schedule.cron({ hour: '19', minute: '0' }),
            minCapacity: 0
        });

        autoScalingGroup.scaleOnSchedule('ScaleUp', {
            schedule: asg.Schedule.cron({ hour: '6', minute: '0' }),
            minCapacity: 1
        });
    }
}
