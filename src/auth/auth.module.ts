import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [UsersModule, HttpModule, PassportModule, ScheduleModule.forRoot()],
  providers: [UsersService, AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
