import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PgusService } from './pgus.service';
import { PgusController } from './pgus.controller';
import { MeasureGateway } from 'src/measure.gateway';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PGU_SIMULATOR_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'pgu-simulator',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'pgu-simulator-consumer',
          },
        },
      },
    ]),
    HttpModule,
  ],
  controllers: [PgusController],
  providers: [PgusService, MeasureGateway],
})
export class PgusModule {}
