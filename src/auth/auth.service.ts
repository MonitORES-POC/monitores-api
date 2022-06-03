import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { AppConstants } from 'src/app.constants';
import { User } from 'src/users/entities/user.entity';
import { lastValueFrom } from 'rxjs';

export interface Token {
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private httpService: HttpService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const headers = {
      'content-type': 'text/plain',
      Autorization: 'Bearer',
      'Access-Control-Allow-Origin': 'http://localhost:4200',
    };

    const body = JSON.stringify({ id: username, secret: pass });
    const res$ = this.httpService.post<Token>(
      `${AppConstants.FABLO_API}/user/enroll`,
      body,
      {
        headers: headers,
      },
    );
    const res = await lastValueFrom(res$);
    let user: User;
    if (res.data.token) {
      user = new User();
      user.id = username;
      user.token = res.data.token;
    } else {
      user = null;
    }
    return user;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
