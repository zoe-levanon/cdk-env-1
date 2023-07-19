import * as cdk from 'aws-cdk-lib';
import { aws_autoscaling as asg, aws_ec2 as ec2, aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AmazonLinuxCpuType, BlockDeviceVolume, InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";

export class PreviewMachinesEnvStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create a VPC with multiple subnets spread across two AZs (availability zones)
        const vpc = new ec2.Vpc(this, 'MainVPC', {
            vpcName: 'MainVPC',
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'public-subnet',
                    subnetType: ec2.SubnetType.PUBLIC,
                    mapPublicIpOnLaunch: true
                }
            ]
        });

        // Create a security group that will allow access only to specific ports.
        const sg1 = new ec2.SecurityGroup(this, 'SecurityGroup-preview-machines', {
            vpc: vpc
        });
        // Note - this is, of course, very unsafe. We should limit the access to the IP of the office once you have a fixed IP.
        // However, access is still limited only to people that have the private key
        sg1.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow ssh access from the world');

        // Create used data - this is a script that's executed after every EC2 instance is created, and initializes it with customized data.
        const userData = ec2.UserData.forLinux();
        // These lines will install the SSM agent on the instance, however, to use it we still need to define an IAM role and profile, which is not yet done
        userData.addCommands('sudo yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_arm64/amazon-ssm-agent.rpm');
        userData.addCommands('sudo systemctl enable amazon-ssm-agent');
        userData.addCommands('sudo systemctl start amazon-ssm-agent');
        userData.addCommands('yum install -y epel-release');

        // Install ffmpeg
        userData.addCommands('cd /tmp/');
        userData.addCommands('wget -O ffmpeg.tar.xz https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-arm64-static.tar.xz');
        userData.addCommands('tar xvf ffmpeg.tar.xz');
        userData.addCommands('/bin/cp -f */ffmpeg /usr/bin/');
        userData.addCommands('/bin/cp -f */ffprobe /usr/bin/');

        // Install node 18
        userData.addCommands(`curl --silent --location https://rpm.nodesource.com/setup_18.x | sudo bash - && dnf -y install nodejs-18.16.1`);

        // Add commands here to install the software you need on the machine (for example, download a file from
        /*userData.addCommands(`mkdir /myprodudct`);
        userData.addCommands(`cd /myprodudct`);
        userData.addCommands(`aws s3 cp s3://some-bucket/myprodudct.tar.gz .`);
        userData.addCommands(`tar xvf my-package.tar.gz`);
        userData.addCommands(`node /myproduct/server.js`);*/


        // Create the LaunchTemplate (this is used when launching a new EC2 instance)
        const lt = new ec2.LaunchTemplate(this, 'LaunchTemplate-PreviewMachines', {
            launchTemplateName: 'LaunchTemplate-PreviewMachines',
            machineImage: new ec2.AmazonLinux2023ImageSsmParameter({ cpuType: AmazonLinuxCpuType.ARM_64 }),
            // Instance type - notice that this is a Graviton2 instance type, so when we install software, it has to match the ARM architecture, and not intel
            instanceType: InstanceType.of(InstanceClass.C7G, InstanceSize.LARGE),
            userData: userData,
            securityGroup: sg1,
            blockDevices: [{ deviceName: "/dev/xvda", volume: BlockDeviceVolume.ebs(40) }],
            // role: role,
            keyName: process.env.CDK_EC2_KEY_PAIR_NAME
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

        // Add tags.


        // Create an auto-scaling group, and attach it to the load balancer's target group.
        const autoScalingGroup = new asg.AutoScalingGroup(this, 'ASG-PreviewMachines', {
            autoScalingGroupName: 'ASG-PreviewMachines',
            vpc,
            desiredCapacity: 1,
            launchTemplate: lt
        });

        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);
        //
        // // Setup auto-scaling schedule - shut down the machine at 19:00 UTC, and start it up at 6:00 UTC
        // autoScalingGroup.scaleOnSchedule('ScaleDown', {
        //     schedule: asg.Schedule.cron({ hour: '19', minute: '0' }),
        //     desiredCapacity: 0
        // });
        //
        // autoScalingGroup.scaleOnSchedule('ScaleUp', {
        //     schedule: asg.Schedule.cron({ hour: '6', minute: '0' }),
        //     desiredCapacity: 1
        // });
    }
}
