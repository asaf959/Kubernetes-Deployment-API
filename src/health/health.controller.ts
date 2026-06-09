import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeploymentsService } from '../deployments/deployments.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      deploymentsCount: this.deploymentsService.count(),
    };
  }
}
