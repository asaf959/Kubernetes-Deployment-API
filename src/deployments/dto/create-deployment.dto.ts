import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PortConfigDto {
  @ApiPropertyOptional({ default: 8080 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  containerPort?: number = 8080;

  @ApiPropertyOptional({ default: 80 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  servicePort?: number = 80;

  @ApiPropertyOptional({ default: 'TCP' })
  @IsOptional()
  @IsIn(['TCP', 'UDP'])
  protocol?: string = 'TCP';
}

export class ResourceRequirementsDto {
  @ApiPropertyOptional({ default: '100m' })
  @IsOptional()
  @IsString()
  cpuRequest?: string = '100m';

  @ApiPropertyOptional({ default: '500m' })
  @IsOptional()
  @IsString()
  cpuLimit?: string = '500m';

  @ApiPropertyOptional({ default: '128Mi' })
  @IsOptional()
  @IsString()
  memoryRequest?: string = '128Mi';

  @ApiPropertyOptional({ default: '512Mi' })
  @IsOptional()
  @IsString()
  memoryLimit?: string = '512Mi';
}

export class IngressConfigDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean = true;

  @ApiProperty({ example: 'myapp.example.com' })
  @IsString()
  host: string;

  @ApiPropertyOptional({ default: '/' })
  @IsOptional()
  @IsString()
  path?: string = '/';

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  tlsEnabled?: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tlsSecretName?: string;
}

export class HpaConfigDto {
  @ApiProperty({ default: false })
  @IsBoolean()
  enabled: boolean = false;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minReplicas?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxReplicas?: number = 10;

  @ApiPropertyOptional({ default: 70 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  cpuUtilizationThreshold?: number = 70;
}

export class NetworkPolicyConfigDto {
  @ApiProperty({ default: false })
  @IsBoolean()
  enabled: boolean = false;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowNamespaces?: string[] = [];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  allowIngressPorts?: number[] = [];
}

export class RbacConfigDto {
  @ApiProperty({ default: false })
  @IsBoolean()
  enabled: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceAccountName?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  clusterRole?: boolean = false;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  rules?: Record<string, any>[] = [];
}

export class CreateDeploymentDto {
  @ApiProperty({
    example: 'my-app',
    description: 'Lowercase alphanumeric name with hyphens (RFC 1123)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(63)
  @Matches(/^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/, {
    message:
      'name must be lowercase alphanumeric with hyphens, no leading/trailing hyphens',
  })
  name: string;

  @ApiPropertyOptional({ default: 'default', example: 'production' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/, {
    message: 'namespace must be lowercase alphanumeric with hyphens',
  })
  namespace?: string = 'default';

  @ApiProperty({ example: 'nginx:1.25' })
  @IsString()
  @MinLength(1)
  image: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  replicas?: number = 1;

  @ApiPropertyOptional({ type: PortConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PortConfigDto)
  ports?: PortConfigDto = new PortConfigDto();

  @ApiPropertyOptional({ type: Object, example: { NODE_ENV: 'production' } })
  @IsOptional()
  @IsObject()
  envVars?: Record<string, string> = {};

  @ApiPropertyOptional({ type: Object, example: { DB_HOST: 'postgres-svc' } })
  @IsOptional()
  @IsObject()
  configMapData?: Record<string, string> = {};

  @ApiPropertyOptional({ type: ResourceRequirementsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResourceRequirementsDto)
  resources?: ResourceRequirementsDto = new ResourceRequirementsDto();

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  labels?: Record<string, string> = {};

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  annotations?: Record<string, string> = {};

  @ApiPropertyOptional({ type: IngressConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IngressConfigDto)
  ingress?: IngressConfigDto;

  @ApiPropertyOptional({ type: HpaConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HpaConfigDto)
  hpa?: HpaConfigDto;

  @ApiPropertyOptional({ type: NetworkPolicyConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NetworkPolicyConfigDto)
  networkPolicy?: NetworkPolicyConfigDto;

  @ApiPropertyOptional({ type: RbacConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RbacConfigDto)
  rbac?: RbacConfigDto;
}
