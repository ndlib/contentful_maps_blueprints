import * as cdk from '@aws-cdk/core'
import { RestApi, PassthroughBehavior, LambdaIntegration, MethodLoggingLevel } from '@aws-cdk/aws-apigateway'
import { Function, Code, Runtime } from '@aws-cdk/aws-lambda'
import { RetentionDays } from '@aws-cdk/aws-logs'
import { StringParameter } from '@aws-cdk/aws-ssm'

export interface IContentfulMapsStackProps extends cdk.StackProps {
  readonly stage: string
  readonly lambdaCodePath: string
  readonly sentryProject: string
  readonly sentryVersion: string
}

export default class ContentfulMapsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: IContentfulMapsStackProps) {
    super(scope, id, props)

    // LAMBDAS
    const paramStorePath = `/all/contentfulmaps/${props.stage}`
    const env = {
      SENTRY_DSN: StringParameter.valueForStringParameter(this, `${paramStorePath}/sentry_dsn`),
      SENTRY_ENVIRONMENT: props.stage,
      SENTRY_RELEASE: `${props.sentryProject}@${props.sentryVersion}`,
      DIRECT_ENDPOINT: cdk.Fn.importValue(`contentfuldirect-${props.stage}-api-url`),
    }

    const mapQueryLambda = new Function(this, 'MapQueryFunction', {
      functionName: `${props.stackName}-map-query`,
      description: 'Queries contentful for a matching floor.',
      code: Code.fromAsset(props.lambdaCodePath),
      handler: 'main.handler',
      runtime: Runtime.PYTHON_2_7,
      logRetention: RetentionDays.ONE_WEEK,
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      environment: env,
    })

    // API GATEWAY
    const api = new RestApi(this, 'ApiGateway', {
      restApiName: props.stackName,
      description: 'Contentful Maps API',
      endpointExportName: `${props.stackName}-api-url`,
      deployOptions: {
        stageName: props.stage,
        metricsEnabled: true,
        loggingLevel: MethodLoggingLevel.ERROR,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowCredentials: false,
        statusCode: 200,
      },
    })
    api.addRequestValidator('RequestValidator', {
      validateRequestParameters: true,
    })
    const mapResource = api.root.addResource('map')
    const integrationOptions = {
      passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
      requestParameters: {
        'integration.request.querystring.collection': 'method.request.querystring.collection',
        'integration.request.querystring.sublibrary': 'method.request.querystring.sublibrary',
        'integration.request.querystring.call_number': 'method.request.querystring.call_number',
      },
    }
    const methodOptions = {
      requestParameters: {
        'method.request.querystring.collection': true,
        'method.request.querystring.sublibrary': true,
        'method.request.querystring.call_number': true,
      },
    }
    mapResource.addMethod('GET', new LambdaIntegration(mapQueryLambda, integrationOptions), methodOptions)
  }
}
