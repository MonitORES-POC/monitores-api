import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ClientKafka } from '@nestjs/microservices';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AppConstants } from 'src/app.constants';
import { MeasureGateway } from 'src/measure.gateway';
import { CreatePgusDto } from './dto/create-pgus.dto';
import { UpdatePgusDto } from './dto/update-pgus.dto';
import { createPguEvent } from './events/create-pgu.event';
import { MeasureEvent } from './events/measure.event';
import { catchError, lastValueFrom, Observable, of } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import { StateBufferService } from './state-buffer/state-buffer.service';
import { PguStateUpdateDto } from './dto/pgu-state-update.dto';
import { Constraint } from './entities/constraint';

@Injectable()
export class PgusService {
  private pgusQueryUrl = `${AppConstants.FABLO_API}${AppConstants.smartContractQueryPoint}`;
  private pgusInvokeUrl = `${AppConstants.FABLO_API}${AppConstants.smartContractInvokePoint}`;
  private logger: Logger = new Logger('PgusService');

  constructor(
    private measureGateway: MeasureGateway,
    @Inject('PGU_SIMULATOR_SERVICE')
    private readonly pguSimulatorClient: ClientKafka,
    private httpService: HttpService,
    private authService: AuthService,
    private schedulerRegistry: SchedulerRegistry,
    private stateBufferService: StateBufferService,
  ) {}

  create(createPgusDto: CreatePgusDto, token: string) {
    this.logger.log('creating pgu ! ....');
    const creationTime = new Date();
    const body = {
      method: AppConstants.PGUMonitorContractMethod.createPGU,
      args: [
        createPgusDto.newPgu.id.toString(),
        createPgusDto.newPgu.owner,
        createPgusDto.newPgu.sourceTypeId.toString(),
        createPgusDto.newPgu.installedPower.toString(),
        createPgusDto.newPgu.contractPower.toString(),
        creationTime.toUTCString(),
        createPgusDto.newPgu.amplificationFactor.toString(),
      ],
    };
    this.httpService
      .post(this.pgusInvokeUrl, JSON.stringify(body), {
        headers: { Authorization: token },
      })
      .pipe(catchError(this.handleError<any>('createPGU')))
      .subscribe((res) => {
        if (res.status === 201 || res.status === 200) {
          this.pguSimulatorClient.emit(
            'createPgu',
            new createPguEvent(
              createPgusDto.newPgu,
              createPgusDto.isRespectful,
              createPgusDto.fromHistoricalData,
            ),
          );
          this.logger.log('PGU created, now init' + createPgusDto);
          this.logger.log('response ' + res.data.response + res.status);
          this.onboardPGU(createPgusDto.newPgu.id);
        }
      });
  }

  async findAll(token: string) {
    console.log('getting pgus ! ....');
    const body = {
      method: AppConstants.PGUMonitorContractMethod.getAllPGUs,
      args: [],
    };
    const res$ = this.httpService
      .post(this.pgusQueryUrl, JSON.stringify(body), {
        headers: { Authorization: token },
      })
      .pipe(catchError(this.handleError<any>('find all PGUs')));

    const res = await lastValueFrom(res$);

    if (res.status === 201 || res.status === 200) {
      console.log('Pgus loaded ' + res.status);
      return res.data.response;
    } else if (res.status === 403) {
      throw new UnauthorizedException();
    } else {
      console.log('error: ' + JSON.stringify(res.status));
    }
  }

  async findOne(id: number, token: string) {
    console.log('getting pgu ! ....');
    const body = {
      method: AppConstants.PGUMonitorContractMethod.getPGU,
      args: [id.toString()],
    };
    const res$ = this.httpService
      .post(this.pgusQueryUrl, JSON.stringify(body), {
        headers: { Authorization: token },
      })
      .pipe(catchError(this.handleError<any>('find one PGU')));

    const res = await lastValueFrom(res$);

    if (res.status === 201 || res.status === 200) {
      console.log('Pgu loaded ' + res.status);
      return res.data.response;
    } else if (res.status === 403) {
      throw new UnauthorizedException();
    } else {
      console.log('error: ' + JSON.stringify(res.status));
    }
  }

  update(id: number, updatePgusDto: UpdatePgusDto) {
    return `This action updates a #${id} pgus`;
  }

  remove(id: number) {
    return `This action removes a #${id} pgus`;
  }

  handlePowerMeasure(measure: MeasureEvent) {
    console.log(
      'pgu-' +
        measure.id +
        ' -> ' +
        measure.measuredPower +
        ' ' +
        measure.timeStamp +
        ' : measure received in api gateway',
    );
    console.log('submitting meeasure pgu ! ....');
    const body = {
      // TODO refactor all smart contracts bodies
      method: AppConstants.PGUMonitorContractMethod.submitMeasurePGU,
      args: [
        measure.id.toString(),
        measure.measuredPower.toString(),
        measure.timeStamp.toString(),
      ],
    };
    this.httpService
      .post(this.pgusInvokeUrl, JSON.stringify(body), {
        headers: { Authorization: 'Bearer ' + this.authService.getApiToken() },
      })
      .pipe(catchError(this.handleError<any>('handle pgu measure')))
      .subscribe((res) => {
        if (res.status === 201 || res.status === 200) {
          //this.measureGateway.sendMeasuresToClients(measure);
        } else if (res.status === 403) {
          throw new UnauthorizedException();
        } else {
          console.log('error: ' + JSON.stringify(res.status));
        }
      });
  }

  onboardPGU(id: number) {
    this.stateBufferService.initBuffer(id);
    const jobName = 'pgu-' + id;
    this.logger.log('Starting onboarding phase');
    const newJob = new CronJob(`30 */${AppConstants.MINUTES} * * * *`, () => {
      this.getMeasure(id);
      this.logger.warn(
        `time (${AppConstants.MINUTES}) for job ${jobName} to run!`,
      );
    });
    this.schedulerRegistry.addCronJob(jobName, newJob);
    newJob.start();

    this.logger.warn(
      `job ${jobName} added for each minute at ${AppConstants.MINUTES} minutes!`,
    );
  }

  getMeasure(id: number) {
    this.logger.log('measuring pgu ! ....');
    const expectedTime: Date = new Date();
    const body = {
      method: AppConstants.PGUMonitorContractMethod.getMeasurePGU,
      args: [id.toString(), expectedTime.toString()],
    };
    this.httpService
      .post(this.pgusInvokeUrl, JSON.stringify(body), {
        headers: { Authorization: 'Bearer ' + this.authService.getApiToken() },
      })
      .pipe(catchError(this.handleError<any>('get Measure')))
      .subscribe((res) => {
        if (res.status === 201 || res.status === 200) {
          let measure: MeasureEvent;
          const pguUpdate: PguStateUpdateDto = res.data.response;
          if (pguUpdate.measure.measuredPower !== null) {
            measure = {
              timeStamp: new Date(pguUpdate.measure.timeStamp),
              measuredPower: pguUpdate.measure.measuredPower,
              id: id,
            };
            this.logger.warn('Measure verified:' + JSON.stringify(measure));
            if (
              pguUpdate.onBoardPercentage !== null &&
              pguUpdate.onBoardPercentage !== undefined
            ) {
              this.logger.warn(
                'Currently ' +
                  pguUpdate.onBoardPercentage * 100 +
                  '% test passed',
              );
              if (pguUpdate.onBoardPercentage === 0.5) {
                const now = new Date();
                const testConstraint = {
                  powerLimit:
                    pguUpdate.onBoardPercentage * measure.measuredPower,
                  applicationTime: new Date(
                    now.getTime() + 60 * 5 * 1000,
                  ).toString(),
                } as Constraint;
                this.submitConstraint(id.toString(), testConstraint);
              }
            }
          } else {
            measure = {
              timeStamp: expectedTime,
              measuredPower: null,
              id: id,
            };
            this.logger.warn('Measure missed:' + JSON.stringify(measure));
          }

          this.stateBufferService.updateBuffer(id, pguUpdate);
          this.measureGateway.sendMeasuresToClients(pguUpdate);
        } else if (res.status === 403) {
          throw new UnauthorizedException();
        } else {
          this.logger.warn('error: ' + JSON.stringify(res.status));
        }
      });
  }

  submitConstraint(id: string, constraint: Constraint, token?: string) {
    const authToken =
      token === undefined ? 'Bearer ' + this.authService.getApiToken() : token;
    this.logger.log('constraining pgu ! ....');
    const body = {
      method: AppConstants.PGUMonitorContractMethod.submitConstraint,
      args: [id, constraint.powerLimit.toString(), constraint.applicationTime],
    };
    this.httpService
      .post(this.pgusInvokeUrl, JSON.stringify(body), {
        headers: { Authorization: authToken },
      })
      .pipe(catchError(this.handleError<any>('Submit constraint')))
      .subscribe((res) => {
        if (res.status === 201 || res.status === 200) {
          this.logger.log('constraint submitted ! ....');
        } else if (res.status === 403) {
          throw new UnauthorizedException();
        } else {
          this.logger.warn('error: ' + JSON.stringify(res.status));
          throw new NotFoundException();
        }
      });
  }

  async getConstraint(id: number) {
    this.logger.log('checking for constraint pgu ! ....');
    const body = {
      method: AppConstants.PGUMonitorContractMethod.getConstraint,
      args: [id.toString()],
    };
    const res$ = this.httpService
      .post(this.pgusQueryUrl, JSON.stringify(body), {
        headers: { Authorization: 'Bearer ' + this.authService.getApiToken() },
      })
      .pipe(catchError(this.handleError<any>('Get constraint')));
    const res = await lastValueFrom(res$);
    if (res.status === 201 || res.status === 200) {
      return res.data.response;
    } else if (res.status === 403) {
      throw new UnauthorizedException();
    } else {
      this.logger.warn('error: ' + JSON.stringify(res.status));
    }
  }

  async declareAlert(id: string, token: string) {
    this.logger.log('declaring alert for pgu' + id + ' ! ....');
    const body = {
      method: AppConstants.PGUMonitorContractMethod.declareAlert,
      args: [id.toString()],
    };
    const res$ = this.httpService
      .post(this.pgusInvokeUrl, JSON.stringify(body), {
        headers: { Authorization: token },
      })
      .pipe(catchError(this.handleError<any>('Declare alert')));
    const res = await lastValueFrom(res$);
    if (res.status === 201 || res.status === 200) {
      return res.data.response;
    } else if (res.status === 403) {
      throw new UnauthorizedException();
    } else {
      this.logger.warn('error: ' + JSON.stringify(res.status));
    }
  }

  async declareUrgency(id: string, token: string) {
    this.logger.log('declaring urgency for pgu' + id + ' ! ....');
    const body = {
      method: AppConstants.PGUMonitorContractMethod.declareUrgency,
      args: [id.toString()],
    };
    const res$ = this.httpService
      .post(this.pgusInvokeUrl, JSON.stringify(body), {
        headers: { Authorization: token },
      })
      .pipe(catchError(this.handleError<any>('Declare Urgency')));
    const res = await lastValueFrom(res$);
    if (res.status === 201 || res.status === 200) {
      return res.data.response;
    } else if (res.status === 403) {
      throw new UnauthorizedException();
    } else {
      this.logger.warn('error: ' + JSON.stringify(res.status));
    }
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      this.logger.error(error);
      this.logger.log(`${operation} failed: ${error?.message}`);
      throw new HttpException(error?.response.data, error?.response.status);
    };
  }
}
