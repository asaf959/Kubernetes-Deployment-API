import { CreateDeploymentDto } from '../../deployments/dto/create-deployment.dto';

export function generateRbac(dto: CreateDeploymentDto): object[] | null {
  if (!dto.rbac?.enabled) return null;

  const namespace = dto.namespace || 'default';
  const saName = dto.rbac.serviceAccountName || `${dto.name}-sa`;
  const isCluster = dto.rbac.clusterRole ?? false;

  const roleKind = isCluster ? 'ClusterRole' : 'Role';
  const bindingKind = isCluster ? 'ClusterRoleBinding' : 'RoleBinding';
  const apiVersion = 'rbac.authorization.k8s.io/v1';

  const defaultRules = [
    { apiGroups: [''], resources: ['configmaps'], verbs: ['get', 'list', 'watch'] },
    { apiGroups: [''], resources: ['secrets'], verbs: ['get'] },
  ];

  const serviceAccount = {
    apiVersion: 'v1',
    kind: 'ServiceAccount',
    metadata: {
      name: saName,
      namespace,
      labels: { app: dto.name, 'managed-by': 'k8s-deployment-api' },
    },
  };

  const role: any = {
    apiVersion,
    kind: roleKind,
    metadata: {
      name: `${dto.name}-role`,
      labels: { app: dto.name, 'managed-by': 'k8s-deployment-api' },
    },
    rules: dto.rbac.rules?.length ? dto.rbac.rules : defaultRules,
  };
  if (!isCluster) role.metadata.namespace = namespace;

  const binding: any = {
    apiVersion,
    kind: bindingKind,
    metadata: {
      name: `${dto.name}-binding`,
      labels: { app: dto.name, 'managed-by': 'k8s-deployment-api' },
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: roleKind,
      name: `${dto.name}-role`,
    },
    subjects: [{ kind: 'ServiceAccount', name: saName, namespace }],
  };
  if (!isCluster) binding.metadata.namespace = namespace;

  return [serviceAccount, role, binding];
}
