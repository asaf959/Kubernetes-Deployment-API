import { CreateDeploymentDto } from '../../deployments/dto/create-deployment.dto';

export function generateService(dto: CreateDeploymentDto): object {
  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: `${dto.name}-svc`,
      namespace: dto.namespace || 'default',
      labels: {
        app: dto.name,
        'managed-by': 'k8s-deployment-api',
      },
    },
    spec: {
      selector: { app: dto.name },
      ports: [
        {
          port: dto.ports?.servicePort ?? 80,
          targetPort: dto.ports?.containerPort ?? 8080,
          protocol: dto.ports?.protocol ?? 'TCP',
        },
      ],
      type: 'ClusterIP',
    },
  };
}
