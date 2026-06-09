import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeploymentStatus } from '../interfaces/deployment.interface';

export class QueryDeploymentsDto {
  @ApiPropertyOptional({ description: 'Filter by namespace name' })
  @IsOptional()
  @IsString()
  namespace?: string;

  @ApiPropertyOptional({ enum: DeploymentStatus })
  @IsOptional()
  @IsEnum(DeploymentStatus)
  status?: DeploymentStatus;
}
