import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('K8s Deployment API (e2e)', () => {
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

  describe('GET /health', () => {
    it('should return 200 with healthy status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('healthy');
          expect(res.body.version).toBe('1.0.0');
          expect(typeof res.body.deploymentsCount).toBe('number');
        });
    });
  });

  describe('POST /api/v1/deployments', () => {
    const minimalPayload = { name: 'test-app', image: 'nginx:1.25' };

    it('creates a deployment and returns 201', () => {
      return request(app.getHttpServer())
        .post('/api/v1/deployments')
        .send(minimalPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.status).toBe('ready');
          expect(res.body.manifests).toBeDefined();
          expect(res.body.manifests.namespace).toBeDefined();
          expect(res.body.manifests.deployment).toBeDefined();
          expect(res.body.manifests.service).toBeDefined();
          expect(res.body.manifests.configmap).toBeDefined();
        });
    });

    it('returns 400 for invalid name (uppercase)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/deployments')
        .send({ name: 'InvalidName', image: 'nginx:1.25' })
        .expect(400);
    });

    it('returns 400 when name is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/deployments')
        .send({ image: 'nginx:1.25' })
        .expect(400);
    });

    it('returns 400 when image is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/deployments')
        .send({ name: 'a-name' })
        .expect(400);
    });

    it('includes ingress in manifests when enabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/deployments')
        .send({
          name: 'ingress-app',
          image: 'nginx:1.25',
          ingress: { enabled: true, host: 'test.example.com' },
        })
        .expect(201);
      expect(res.body.manifests['ingress']).toContain('Ingress');
      expect(res.body.manifests['ingress']).toContain('test.example.com');
    });

    it('includes HPA / NetworkPolicy / RBAC when enabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/deployments')
        .send({
          name: 'full-app',
          image: 'nginx:1.25',
          hpa: { enabled: true, minReplicas: 2, maxReplicas: 5 },
          networkPolicy: { enabled: true, allowNamespaces: ['monitoring'] },
          rbac: { enabled: true, clusterRole: false },
        })
        .expect(201);
      expect(res.body.manifests['hpa']).toContain('HorizontalPodAutoscaler');
      expect(res.body.manifests['network-policy']).toContain('NetworkPolicy');
      expect(res.body.manifests['rbac']).toContain('ServiceAccount');
      expect(res.body.manifests['rbac']).toContain('RoleBinding');
    });
  });

  describe('GET /api/v1/deployments', () => {
    it('returns an array', () => {
      return request(app.getHttpServer())
        .get('/api/v1/deployments')
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });
  });

  describe('GET /api/v1/deployments/:id', () => {
    it('returns 404 for unknown id', () => {
      return request(app.getHttpServer())
        .get('/api/v1/deployments/does-not-exist')
        .expect(404);
    });
  });

  describe('GET /api/v1/deployments/:id/manifests', () => {
    it('returns YAML download for a created deployment', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/deployments')
        .send({ name: 'yaml-app', image: 'nginx:1.25' })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/api/v1/deployments/${created.body.id}/manifests`)
        .expect(200)
        .expect('Content-Type', /text\/plain/)
        .expect((res) => {
          expect(res.text).toContain('kind: Deployment');
          expect(res.text).toContain('kind: Service');
          expect(res.headers['content-disposition']).toContain('yaml-app-manifests.yaml');
        });
    });
  });

  describe('DELETE /api/v1/deployments/:id', () => {
    it('deletes a deployment and returns 204', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/deployments')
        .send({ name: 'delete-me', image: 'nginx:1.25' })
        .expect(201);

      return request(app.getHttpServer())
        .delete(`/api/v1/deployments/${createRes.body.id}`)
        .expect(204);
    });

    it('returns 404 when deleting unknown id', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/deployments/does-not-exist')
        .expect(404);
    });
  });
});
