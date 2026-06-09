import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DeploymentsModule } from '../deployments/deployments.module';

@Module({
  imports: [DeploymentsModule],
  controllers: [HealthController],
})
export class HealthModule {}
