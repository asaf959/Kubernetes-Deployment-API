import { CreateDeploymentDto } from '../../deployments/dto/create-deployment.dto';

export function generateIngress(dto: CreateDeploymentDto): object | null {
  if (!dto.ingress?.enabled) return null;

  const { host, path = '/', tlsEnabled, tlsSecretName } = dto.ingress;

  const manifest: any = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: `${dto.name}-ingress`,
      namespace: dto.namespace || 'default',
      labels: { app: dto.name, 'managed-by': 'k8s-deployment-api' },
      annotations: { 'nginx.ingress.kubernetes.io/rewrite-target': '/' },
    },
    spec: {
      ingressClassName: 'nginx',
      rules: [
        {
          host,
          http: {
            paths: [
              {
                path,
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: `${dto.name}-svc`,
                    port: { number: dto.ports?.servicePort ?? 80 },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };

  if (tlsEnabled && tlsSecretName) {
    manifest.spec.tls = [{ hosts: [host], secretName: tlsSecretName }];
  }

  return manifest;
}
