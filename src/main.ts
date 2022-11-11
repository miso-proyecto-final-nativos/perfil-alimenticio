import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT ? Number(process.env.PORT) : 4050;
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: port,
    },
  });
  app.startAllMicroservices();
  await app.listen(3050);
  console.info('Microservice perfil-alimenticio listening on port:', port);
  app.useGlobalPipes(new ValidationPipe());
}
bootstrap();
