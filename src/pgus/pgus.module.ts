import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PgusService } from './pgus.service';
import { PgusController } from './pgus.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { StateBufferService } from './state-buffer/state-buffer.service';
import { MeasureGateway } from 'src/measure.gateway';

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
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
  ],
  controllers: [PgusController],
  providers: [PgusService, ConfigService, StateBufferService, MeasureGateway],
})
export class PgusModule {}
