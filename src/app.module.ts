import { Module } from '@nestjs/common';
import { DeploymentsModule } from './deployments/deployments.module';
import { ManifestsModule } from './manifests/manifests.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [DeploymentsModule, ManifestsModule, HealthModule],
})
export class AppModule {}
