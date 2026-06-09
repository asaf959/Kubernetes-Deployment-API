import { CreateDeploymentDto } from '../dto/create-deployment.dto';

export enum DeploymentStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
}

export interface DeploymentRecord {
  id: string;
  name: string;
  namespace: string;
  status: DeploymentStatus;
  request: CreateDeploymentDto;
  manifests: Record<string, string> | null;
  combinedManifest: string | null;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}
