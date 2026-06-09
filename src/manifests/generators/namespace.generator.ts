import { CreateDeploymentDto } from '../../deployments/dto/create-deployment.dto';

export function generateNamespace(dto: CreateDeploymentDto): object {
  return {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: {
      name: dto.namespace || 'default',
      labels: {
        'managed-by': 'k8s-deployment-api',
      },
    },
  };
}
