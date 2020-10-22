import { PipelineProject, BuildSpec, BuildEnvironmentVariableType, LinuxBuildImage } from '@aws-cdk/aws-codebuild'
import { Role } from '@aws-cdk/aws-iam'
import { Construct } from '@aws-cdk/core'

export interface IContentfulMapsQaProjectProps {
  readonly stage: string
  readonly role: Role
}

export class ContentfulMapsQaProject extends PipelineProject {
  constructor(scope: Construct, id: string, props: IContentfulMapsQaProjectProps) {
    const paramStorePath = `/all/contentfulmaps/${props.stage}`
    const pipelineProps = {
      role: props.role,
      environment: {
        buildImage: LinuxBuildImage.fromDockerRegistry('postman/newman'),
        environmentVariables: {
          API_URL: {
            value: `${paramStorePath}/api-url`,
            type: BuildEnvironmentVariableType.PARAMETER_STORE,
          },
        },
      },
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo "Ensure that the Newman spec is readable"',
              'chmod -R 755 ./tests/postman/*',
            ],
          },
          build: {
            commands: [
              'echo "Beginning tests at `date`"',
              `newman run ./tests/postman/qa_collection.json --env-var contentfulMapsApiUrl=$API_URL`,
            ],
          },
        },
      }),
    }
    super(scope, id, pipelineProps)
  }
}

export default ContentfulMapsQaProject
