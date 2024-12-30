import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as serverless from 'serverless-http';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,OPTIONS', 
    allowedHeaders: 'Content-Type, Authorization, X-CSRF-Token',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const globalPrefix = '.netlify/functions/main';
  app.setGlobalPrefix(globalPrefix);
  await app.init();
  return serverless(app as unknown as serverless.Application);
}

export const handler = bootstrap();
