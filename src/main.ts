import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Kubernetes Deployment API')
    .setDescription(
      'REST API that accepts deployment requests and generates Kubernetes manifests ' +
        '(Namespace, Deployment, Service, Ingress, ConfigMap, HPA, NetworkPolicy, RBAC)',
    )
    .setVersion('1.0.0')
    .addTag('Health')
    .addTag('Deployments')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`K8s Deployment API running on: http://localhost:${port}`);
  logger.log(`Swagger UI: http://localhost:${port}/docs`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
