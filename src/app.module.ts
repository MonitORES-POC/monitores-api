import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PgusModule } from './pgus/pgus.module';
import { MeasureGateway } from './measure.gateway';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PgusModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, MeasureGateway],
})
export class AppModule {}
