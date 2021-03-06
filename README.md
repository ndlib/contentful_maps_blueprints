# contentful_maps_blueprints
Infrastructure-as-code for the Hesburgh Libraries [contentful_maps service](https://github.com/ndlib/contentful_maps).

## Useful commands

 * `yarn build`   compile typescript to js
 * `yarn watch`   watch for changes and compile
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

## Dependencies
 * [contentful-direct](https://github.com/ndlib/contentful_direct_blueprints)

## Deployment
```
cdk deploy contentfulmaps-pipeline -c slackNotifyStackName=[stack-name]
```
Please ensure Slack notifications will go to #wse-deployment-approvals.
