import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentResponseDto } from './dto/deployment-response.dto';
import { DeploymentStatus } from './interfaces/deployment.interface';

@ApiTags('Deployments')
@Controller('api/v1/deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new deployment and generate K8s manifests' })
  @ApiCreatedResponse({
    description: 'Deployment created with generated manifests',
    type: DeploymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateDeploymentDto) {
    return this.deploymentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all deployments (with optional filters)' })
  @ApiQuery({ name: 'namespace', required: false })
  @ApiQuery({ name: 'status', required: false, enum: DeploymentStatus })
  @ApiOkResponse({ type: [DeploymentResponseDto] })
  findAll(
    @Query('namespace') namespace?: string,
    @Query('status') status?: DeploymentStatus,
  ) {
    return this.deploymentsService.findAll(namespace, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a deployment by ID' })
  @ApiParam({ name: 'id', description: 'Deployment UUID' })
  @ApiOkResponse({ type: DeploymentResponseDto })
  @ApiResponse({ status: 404, description: 'Deployment not found' })
  findOne(@Param('id') id: string) {
    return this.deploymentsService.findOne(id);
  }

  @Get(':id/manifests')
  @ApiOperation({ summary: 'Download the combined YAML manifests for a deployment' })
  @ApiParam({ name: 'id', description: 'Deployment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Raw YAML manifests',
    content: { 'text/plain': {} },
  })
  @ApiResponse({ status: 404, description: 'Deployment not found' })
  getManifests(@Param('id') id: string, @Res() res: Response) {
    const record = this.deploymentsService.findOne(id);
    const yamlStr = this.deploymentsService.getManifests(id);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${record.name}-manifests.yaml"`,
    );
    res.send(yamlStr);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deployment record' })
  @ApiParam({ name: 'id', description: 'Deployment UUID' })
  @ApiNoContentResponse({ description: 'Deployment deleted' })
  remove(@Param('id') id: string) {
    this.deploymentsService.remove(id);
  }
}
