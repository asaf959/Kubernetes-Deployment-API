import { ManifestsService } from '../manifests/manifests.service';
import * as yaml from 'js-yaml';

describe('ManifestsService', () => {
  let service: ManifestsService;

  beforeEach(() => {
    service = new ManifestsService();
  });

  const minimalDto: any = {
    name: 'test-app',
    namespace: 'default',
    image: 'nginx:1.25',
    replicas: 1,
    ports: { containerPort: 8080, servicePort: 80, protocol: 'TCP' },
    envVars: {},
    configMapData: {},
    resources: {
      cpuRequest: '100m',
      cpuLimit: '500m',
      memoryRequest: '128Mi',
      memoryLimit: '512Mi',
    },
  };

  it('should generate valid YAML for minimal config', () => {
    const result = service.generate(minimalDto);
    expect(() => yaml.loadAll(result.combined)).not.toThrow();
  });

  it('should include all required resource types', () => {
    const { individual } = service.generate(minimalDto);
    expect(individual['namespace']).toBeDefined();
    expect(individual['configmap']).toBeDefined();
    expect(individual['deployment']).toBeDefined();
    expect(individual['service']).toBeDefined();
  });

  it('should NOT generate ingress when disabled', () => {
    const { individual } = service.generate(minimalDto);
    expect(individual['ingress']).toBeUndefined();
  });

  it('should generate ingress when enabled', () => {
    const dto = {
      ...minimalDto,
      ingress: { enabled: true, host: 'test.example.com', path: '/' },
    };
    const { individual } = service.generate(dto);
    expect(individual['ingress']).toBeDefined();
    expect(individual['ingress']).toContain('Ingress');
    expect(individual['ingress']).toContain('test.example.com');
  });

  it('should generate HPA when enabled', () => {
    const dto = {
      ...minimalDto,
      hpa: {
        enabled: true,
        minReplicas: 2,
        maxReplicas: 5,
        cpuUtilizationThreshold: 70,
      },
    };
    const { individual } = service.generate(dto);
    expect(individual['hpa']).toBeDefined();
    expect(individual['hpa']).toContain('HorizontalPodAutoscaler');
  });

  it('should generate NetworkPolicy when enabled', () => {
    const dto = {
      ...minimalDto,
      networkPolicy: {
        enabled: true,
        allowNamespaces: ['monitoring'],
        allowIngressPorts: [8080],
      },
    };
    const { individual } = service.generate(dto);
    expect(individual['network-policy']).toBeDefined();
    expect(individual['network-policy']).toContain('NetworkPolicy');
  });

  it('should generate RBAC resources when enabled', () => {
    const dto = {
      ...minimalDto,
      rbac: { enabled: true, clusterRole: false, rules: [] },
    };
    const { individual } = service.generate(dto);
    expect(individual['rbac']).toBeDefined();
    expect(individual['rbac']).toContain('ServiceAccount');
    expect(individual['rbac']).toContain('Role');
    expect(individual['rbac']).toContain('RoleBinding');
  });

  it('should generate ClusterRole/ClusterRoleBinding when rbac.clusterRole=true', () => {
    const dto = {
      ...minimalDto,
      rbac: { enabled: true, clusterRole: true, rules: [] },
    };
    const { individual } = service.generate(dto);
    expect(individual['rbac']).toContain('ClusterRole');
    expect(individual['rbac']).toContain('ClusterRoleBinding');
  });

  it('should use correct image in deployment manifest', () => {
    const { individual } = service.generate({ ...minimalDto, image: 'myapp:v2.0' });
    expect(individual['deployment']).toContain('myapp:v2.0');
  });

  it('should respect custom replicas count', () => {
    const { individual } = service.generate({ ...minimalDto, replicas: 7 });
    expect(individual['deployment']).toContain('replicas: 7');
  });

  it('combined manifest should be parseable as multi-doc YAML', () => {
    const dto = {
      ...minimalDto,
      ingress: { enabled: true, host: 'a.example.com' },
      hpa: { enabled: true },
      networkPolicy: { enabled: true },
      rbac: { enabled: true },
    };
    const result = service.generate(dto);
    const docs = yaml.loadAll(result.combined);
    expect(docs.length).toBeGreaterThanOrEqual(8);
  });
});
