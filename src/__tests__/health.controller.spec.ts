import { Test } from '@nestjs/testing';
import { HealthController } from '../health/health.controller';
import { DeploymentsService } from '../deployments/deployments.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DeploymentsService, useValue: { count: () => 0 } }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('should return healthy status', () => {
    const result = controller.check();
    expect(result.status).toBe('healthy');
    expect(result.version).toBe('1.0.0');
    expect(result.deploymentsCount).toBe(0);
    expect(result.timestamp).toBeDefined();
  });
});
