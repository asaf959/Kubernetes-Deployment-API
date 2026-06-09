import { CreateDeploymentDto } from '../../deployments/dto/create-deployment.dto';

export function generateHpa(dto: CreateDeploymentDto): object | null {
  if (!dto.hpa?.enabled) return null;

  const { minReplicas = 1, maxReplicas = 10, cpuUtilizationThreshold = 70 } = dto.hpa;

  return {
    apiVersion: 'autoscaling/v2',
    kind: 'HorizontalPodAutoscaler',
    metadata: {
      name: `${dto.name}-hpa`,
      namespace: dto.namespace || 'default',
      labels: { app: dto.name, 'managed-by': 'k8s-deployment-api' },
    },
    spec: {
      scaleTargetRef: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        name: dto.name,
      },
      minReplicas,
      maxReplicas,
      metrics: [
        {
          type: 'Resource',
          resource: {
            name: 'cpu',
            target: {
              type: 'Utilization',
              averageUtilization: cpuUtilizationThreshold,
            },
          },
        },
      ],
    },
  };
}
