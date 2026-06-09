import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as yaml from 'js-yaml';
import { AppModule } from '../src/app.module';

describe('Deployments — manifest correctness (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('combined manifest is valid multi-document YAML for full payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/deployments')
      .send({
        name: 'full-app',
        namespace: 'staging',
        image: 'myrepo/myapp:v2.1.0',
        replicas: 3,
        ports: { containerPort: 3000, servicePort: 80 },
        envVars: { NODE_ENV: 'staging', LOG_LEVEL: 'debug' },
        configMapData: { DB_HOST: 'postgres-svc', CACHE_TTL: '300' },
        resources: {
          cpuRequest: '250m',
          cpuLimit: '1000m',
          memoryRequest: '256Mi',
          memoryLimit: '1Gi',
        },
        ingress: {
          enabled: true,
          host: 'full-app.example.com',
          path: '/',
          tlsEnabled: true,
          tlsSecretName: 'full-app-tls',
        },
        hpa: {
          enabled: true,
          minReplicas: 2,
          maxReplicas: 10,
          cpuUtilizationThreshold: 60,
        },
        networkPolicy: {
          enabled: true,
          allowNamespaces: ['monitoring'],
          allowIngressPorts: [3000],
        },
        rbac: {
          enabled: true,
          serviceAccountName: 'full-app-sa',
          clusterRole: false,
          rules: [
            {
              apiGroups: [''],
              resources: ['configmaps', 'secrets'],
              verbs: ['get', 'list'],
            },
          ],
        },
      })
      .expect(201);

    const id = res.body.id;
    const manifestRes = await request(app.getHttpServer())
      .get(`/api/v1/deployments/${id}/manifests`)
      .expect(200);

    const docs = yaml.loadAll(manifestRes.text) as any[];

    const kinds = docs.map((d) => d.kind).sort();
    expect(kinds).toEqual(
      [
        'ConfigMap',
        'Deployment',
        'HorizontalPodAutoscaler',
        'Ingress',
        'Namespace',
        'NetworkPolicy',
        'Role',
        'RoleBinding',
        'Service',
        'ServiceAccount',
      ].sort(),
    );

    const deployment = docs.find((d) => d.kind === 'Deployment');
    expect(deployment.spec.replicas).toBe(3);
    expect(deployment.spec.template.spec.containers[0].image).toBe(
      'myrepo/myapp:v2.1.0',
    );
    expect(deployment.spec.template.spec.serviceAccountName).toBe('full-app-sa');

    const ingress = docs.find((d) => d.kind === 'Ingress');
    expect(ingress.spec.tls?.[0].secretName).toBe('full-app-tls');

    const hpa = docs.find((d) => d.kind === 'HorizontalPodAutoscaler');
    expect(hpa.spec.minReplicas).toBe(2);
    expect(hpa.spec.maxReplicas).toBe(10);

    const cm = docs.find((d) => d.kind === 'ConfigMap');
    expect(cm.data.DB_HOST).toBe('postgres-svc');
    expect(cm.data.APP_NAME).toBe('full-app');
  });

  it('rejects invalid namespace name', () => {
    return request(app.getHttpServer())
      .post('/api/v1/deployments')
      .send({ name: 'ok-name', namespace: 'BadNS', image: 'nginx:1.25' })
      .expect(400);
  });

  it('filters list by namespace', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/deployments')
      .send({ name: 'a-prod', namespace: 'prod-x', image: 'nginx:1.25' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/v1/deployments?namespace=prod-x')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((r: any) => r.namespace === 'prod-x')).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});
