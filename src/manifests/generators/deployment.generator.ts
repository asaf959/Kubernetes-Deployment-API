import { CreateDeploymentDto } from '../../deployments/dto/create-deployment.dto';

export function generateDeployment(dto: CreateDeploymentDto): object {
  const containerPort = dto.ports?.containerPort ?? 8080;
  const namespace = dto.namespace || 'default';
  const serviceAccountName = dto.rbac?.enabled
    ? dto.rbac.serviceAccountName || `${dto.name}-sa`
    : 'default';

  const envFromVars = Object.entries(dto.envVars || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: dto.name,
      namespace,
      labels: {
        app: dto.name,
        version: '1.0.0',
        'managed-by': 'k8s-deployment-api',
        ...dto.labels,
      },
      annotations: {
        'deployment.kubernetes.io/revision': '1',
        ...dto.annotations,
      },
    },
    spec: {
      replicas: dto.replicas ?? 1,
      selector: {
        matchLabels: { app: dto.name },
      },
      strategy: {
        type: 'RollingUpdate',
        rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
      },
      template: {
        metadata: {
          labels: { app: dto.name, version: '1.0.0' },
        },
        spec: {
          serviceAccountName,
          containers: [
            {
              name: dto.name,
              image: dto.image,
              imagePullPolicy: 'IfNotPresent',
              ports: [{ containerPort, protocol: dto.ports?.protocol ?? 'TCP' }],
              envFrom: [{ configMapRef: { name: `${dto.name}-config` } }],
              ...(envFromVars.length > 0 && { env: envFromVars }),
              resources: {
                requests: {
                  cpu: dto.resources?.cpuRequest ?? '100m',
                  memory: dto.resources?.memoryRequest ?? '128Mi',
                },
                limits: {
                  cpu: dto.resources?.cpuLimit ?? '500m',
                  memory: dto.resources?.memoryLimit ?? '512Mi',
                },
              },
              readinessProbe: {
                httpGet: { path: '/health', port: containerPort },
                initialDelaySeconds: 10,
                periodSeconds: 5,
              },
              livenessProbe: {
                httpGet: { path: '/health', port: containerPort },
                initialDelaySeconds: 30,
                periodSeconds: 10,
              },
              securityContext: {
                allowPrivilegeEscalation: false,
                runAsNonRoot: true,
                runAsUser: 1000,
                readOnlyRootFilesystem: true,
              },
            },
          ],
          securityContext: { fsGroup: 2000 },
        },
      },
    },
  };
}
