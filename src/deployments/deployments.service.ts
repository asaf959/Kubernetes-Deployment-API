import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentRecord, DeploymentStatus } from './interfaces/deployment.interface';
import { ManifestsService } from '../manifests/manifests.service';

@Injectable()
export class DeploymentsService {
  private readonly store = new Map<string, DeploymentRecord>();

  constructor(private readonly manifestsService: ManifestsService) {}

  create(dto: CreateDeploymentDto): DeploymentRecord {
    const id = uuidv4();
    const now = new Date();

    const record: DeploymentRecord = {
      id,
      name: dto.name,
      namespace: dto.namespace || 'default',
      status: DeploymentStatus.GENERATING,
      request: dto,
      manifests: null,
      combinedManifest: null,
      createdAt: now,
      updatedAt: now,
    };

    this.store.set(id, record);

    try {
      const generated = this.manifestsService.generate(dto);
      record.manifests = generated.individual;
      record.combinedManifest = generated.combined;
      record.status = DeploymentStatus.READY;
    } catch (err) {
      record.status = DeploymentStatus.FAILED;
      record.error = err instanceof Error ? err.message : 'Unknown generation error';
    }

    record.updatedAt = new Date();
    this.store.set(id, record);
    return record;
  }

  findAll(namespace?: string, status?: DeploymentStatus): DeploymentRecord[] {
    let records = Array.from(this.store.values());
    if (namespace) records = records.filter((r) => r.namespace === namespace);
    if (status) records = records.filter((r) => r.status === status);
    return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findOne(id: string): DeploymentRecord {
    const record = this.store.get(id);
    if (!record) {
      throw new NotFoundException(`Deployment with id "${id}" not found`);
    }
    return record;
  }

  getManifests(id: string): string {
    const record = this.findOne(id);
    if (!record.combinedManifest) {
      throw new NotFoundException(`No manifests found for deployment "${id}"`);
    }
    return record.combinedManifest;
  }

  remove(id: string): void {
    const record = this.store.get(id);
    if (!record) {
      throw new NotFoundException(`Deployment with id "${id}" not found`);
    }
    this.store.delete(id);
  }

  count(): number {
    return this.store.size;
  }
}
