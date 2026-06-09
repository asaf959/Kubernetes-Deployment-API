import { CreateDeploymentDto } from '../../deployments/dto/create-deployment.dto';

export function generateNetworkPolicy(dto: CreateDeploymentDto): object | null {
  if (!dto.networkPolicy?.enabled) return null;

  const { allowNamespaces = [], allowIngressPorts = [] } = dto.networkPolicy;

  const ingressRules = allowNamespaces.map((ns) => ({
    from: [{ namespaceSelector: { matchLabels: { 'kubernetes.io/metadata.name': ns } } }],
    ...(allowIngressPorts.length > 0 && {
      ports: allowIngressPorts.map((port) => ({ port })),
    }),
  }));

  return {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'NetworkPolicy',
    metadata: {
      name: `${dto.name}-netpol`,
      namespace: dto.namespace || 'default',
      labels: { app: dto.name, 'managed-by': 'k8s-deployment-api' },
    },
    spec: {
      podSelector: { matchLabels: { app: dto.name } },
      policyTypes: ['Ingress', 'Egress'],
      ingress: ingressRules.length > 0 ? ingressRules : [{}],
      egress: [{}],
    },
  };
}
