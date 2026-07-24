import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logDir = 'logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const loggerInstance = WinstonModule.createLogger({
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: winston.format.simple()
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          nestWinstonModuleUtilities.format.nestLike('SistemaSindico', {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger: loggerInstance,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Sistema do Síndico - API')
    .setDescription('Documentação dos Endpoints para Gestão Condominial')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  
  loggerInstance.log(`Aplicação rodando em: 3000`);
  loggerInstance.log(`Documentação Swagger disponível em: 3000/api`);
}
bootstrap();