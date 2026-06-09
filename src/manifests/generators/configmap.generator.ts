import { CreateDeploymentDto } from '../../deployments/dto/create-deployment.dto';

export function generateConfigMap(dto: CreateDeploymentDto): object {
  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: `${dto.name}-config`,
      namespace: dto.namespace || 'default',
      labels: {
        app: dto.name,
        'managed-by': 'k8s-deployment-api',
      },
    },
    data: {
      APP_NAME: dto.name,
      APP_VERSION: '1.0.0',
      ...dto.configMapData,
    },
  };
}
