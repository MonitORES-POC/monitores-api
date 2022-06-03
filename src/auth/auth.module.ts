import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { TokenStrategy } from './strategies/token.strategy';

@Module({
  imports: [UsersModule, HttpModule, PassportModule],
  providers: [AuthService, LocalStrategy, TokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
