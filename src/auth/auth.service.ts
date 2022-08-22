import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HttpService } from '@nestjs/axios';
import { AppConstants } from 'src/app.constants';
import { User } from 'src/users/entities/user.entity';
import { catchError, lastValueFrom, Observable, of } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

export interface Token {
  token: string;
}

@Injectable()
export class AuthService {
  private logger: Logger = new Logger('auth');
  private apiToken: string;
  constructor(
    private readonly usersService: UsersService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    console.log('Validating user ' + username);
    const headers = {
      'content-type': 'text/plain',
      Authorization: 'Bearer',
      'Access-Control-Allow-Origin': 'http://localhost:4200',
    };

    const body = JSON.stringify({ id: username, secret: pass });
    const res$ = this.httpService
      .post<Token>(`${AppConstants.FABLO_API}/user/enroll`, body, {
        headers: headers,
      })
      .pipe(catchError(this.handleError<any>('User enrolling')));
    const res = await lastValueFrom(res$);
    let user: User;
    if (res?.data.token) {
      user = new User();
      user.id = username;
      user.token = res.data.token;
      if (username === 'admin') {
        this.apiToken = res.data.token;
        console.log(res.data.token);
      }
      console.log('User validated');
    } else {
      user = null;
    }
    return user;
  }

  async enrollApi() {
    const fabloUser = this.configService.get<string>('FABLO_USER');
    const fabloPass = this.configService.get<string>('FABLO_PASSWORD');
    const user = await this.validateUser(fabloUser, fabloPass);
    if (user) {
      this.apiToken = user.token;
    } else {
      console.log('Error enrolling');
    }
  }

  getApiToken(): string {
    return this.apiToken;
  }

  @Cron('0 */9 * * * *')
  async reEnrollApi() {
    await this.enrollApi();
    console.log('User reenrolled');
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      this.logger.error(JSON.stringify(error)); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.logger.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
