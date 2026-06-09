import { NotFoundException } from '@nestjs/common';
import { DeploymentsService } from '../deployments/deployments.service';
import { ManifestsService } from '../manifests/manifests.service';
import { CreateDeploymentDto } from '../deployments/dto/create-deployment.dto';
import { DeploymentStatus } from '../deployments/interfaces/deployment.interface';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let manifestsService: ManifestsService;

  beforeEach(() => {
    manifestsService = new ManifestsService();
    service = new DeploymentsService(manifestsService);
  });

  const baseDto = (over: Partial<CreateDeploymentDto> = {}): CreateDeploymentDto =>
    ({
      name: 'demo-app',
      namespace: 'default',
      image: 'nginx:1.25',
      replicas: 1,
      ports: { containerPort: 8080, servicePort: 80, protocol: 'TCP' } as any,
      envVars: {},
      configMapData: {},
      resources: {
        cpuRequest: '100m',
        cpuLimit: '500m',
        memoryRequest: '128Mi',
        memoryLimit: '512Mi',
      } as any,
      ...over,
    }) as CreateDeploymentDto;

  it('creates a deployment in READY state', () => {
    const record = service.create(baseDto());
    expect(record.id).toBeDefined();
    expect(record.status).toBe(DeploymentStatus.READY);
    expect(record.manifests).not.toBeNull();
    expect(record.combinedManifest).not.toBeNull();
    expect(record.createdAt).toBeInstanceOf(Date);
  });

  it('finds a deployment by id', () => {
    const created = service.create(baseDto());
    const found = service.findOne(created.id);
    expect(found.id).toBe(created.id);
  });

  it('throws NotFoundException for unknown id', () => {
    expect(() => service.findOne('does-not-exist')).toThrow(NotFoundException);
  });

  it('returns combined manifest as YAML string', () => {
    const created = service.create(baseDto());
    const yamlStr = service.getManifests(created.id);
    expect(typeof yamlStr).toBe('string');
    expect(yamlStr).toContain('kind: Deployment');
  });

  it('lists deployments and filters by namespace', () => {
    service.create(baseDto({ name: 'a-app', namespace: 'ns-a' }));
    service.create(baseDto({ name: 'b-app', namespace: 'ns-b' }));
    expect(service.findAll().length).toBe(2);
    expect(service.findAll('ns-a').length).toBe(1);
    expect(service.findAll('ns-a')[0].name).toBe('a-app');
  });

  it('filters by status', () => {
    service.create(baseDto());
    expect(service.findAll(undefined, DeploymentStatus.READY).length).toBe(1);
    expect(service.findAll(undefined, DeploymentStatus.FAILED).length).toBe(0);
  });

  it('removes a deployment', () => {
    const created = service.create(baseDto());
    service.remove(created.id);
    expect(() => service.findOne(created.id)).toThrow(NotFoundException);
  });

  it('remove throws for unknown id', () => {
    expect(() => service.remove('missing')).toThrow(NotFoundException);
  });

  it('count reflects store size', () => {
    expect(service.count()).toBe(0);
    service.create(baseDto({ name: 'one' }));
    service.create(baseDto({ name: 'two' }));
    expect(service.count()).toBe(2);
  });

  it('marks deployment FAILED when manifest generation throws', () => {
    jest.spyOn(manifestsService, 'generate').mockImplementation(() => {
      throw new Error('boom');
    });
    const record = service.create(baseDto());
    expect(record.status).toBe(DeploymentStatus.FAILED);
    expect(record.error).toBe('boom');
  });
});
