import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDeploymentDto } from './create-deployment.dto';
import { DeploymentStatus } from '../interfaces/deployment.interface';

export class DeploymentResponseDto {
  @ApiProperty({ example: 'a3b6e2c0-1234-4abc-9876-1f2e3d4c5b6a' })
  id: string;

  @ApiProperty({ example: 'my-app' })
  name: string;

  @ApiProperty({ example: 'production' })
  namespace: string;

  @ApiProperty({ enum: DeploymentStatus, example: DeploymentStatus.READY })
  status: DeploymentStatus;

  @ApiProperty({ type: CreateDeploymentDto })
  request: CreateDeploymentDto;

  @ApiPropertyOptional({
    type: Object,
    description:
      'Map from K8s resource type (namespace, deployment, service, ingress, configmap, hpa, network-policy, rbac) to its YAML manifest string',
  })
  manifests: Record<string, string> | null;

  @ApiPropertyOptional({
    description: 'All generated manifests joined with `---\\n` separators',
  })
  combinedManifest: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  error?: string;
}
