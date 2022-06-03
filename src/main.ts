import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      port: 3001,
      client: {
        clientId: 'monitores-api',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'monitores-api-consumer',
      },
    },
  });
  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
