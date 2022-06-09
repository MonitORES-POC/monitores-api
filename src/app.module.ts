import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PgusModule } from './pgus/pgus.module';
import { MeasureGateway } from './measure.gateway';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PgusModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: '.dev.env',
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, MeasureGateway],
})
export class AppModule implements OnModuleInit {
  constructor(private authService: AuthService) {}

  onModuleInit() {
    this.authService.enrollApi();
  }
}
