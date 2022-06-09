import {
  Inject,
  Injectable,
  Logger,
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
import { lastValueFrom } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import { StateBufferService } from './state-buffer/state-buffer.service';
import { PguStateUpdateDto } from './dto/pgu-state-update.dto';

@Injectable()
export class PgusService {
  private pgusQueryUrl = `${AppConstants.FABLO_API}${AppConstants.smartContractQueryPoint}`;
  private pgusInvokeUrl = `${AppConstants.FABLO_API}${AppConstants.smartContractInvokePoint}`;
  private static readonly PGUMonitorContractMethod = {
    createPGU: 'MonitorPGUContract:CreatePGU',
    getPGU: 'MonitorPGUContract:GetPGU',
    deletePGU: 'MonitorPGUContract:DeletePGU',
    getAllPGUs: 'MonitorPGUContract:GetAllPGUs',
    submitMeasurePGU: 'MonitorPGUContract:SubmitMeasure',
    getMeasurePGU: 'MonitorPGUContract:GetMeasure',
    submitConstraint: 'MonitorPGUContract:SubmitConstraint',
    getConstraint: 'MonitorPGUContract:GetConstraint',
  };
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
      method: PgusService.PGUMonitorContractMethod.createPGU,
      args: [
        createPgusDto.newPgu.id.toString(),
        createPgusDto.newPgu.owner,
        createPgusDto.newPgu.sourceTypeId.toString(),
        createPgusDto.newPgu.installedPower.toString(),
        createPgusDto.newPgu.contractPower.toString(),
        creationTime.toUTCString(),
      ],
    };
    this.httpService
      .post(this.pgusInvokeUrl, JSON.stringify(body), {
        headers: { Authorization: token },
      })
      .pipe
      // tap((_) => this.log(`added pgu id=${pgu.id}`)),
      //catchError(this.handleError<any>('addPGU')),
      ()
      .subscribe((res) => {
        if (res.status === 201 || res.status === 200) {
          this.pguSimulatorClient.emit(
            'createPgu',
            new createPguEvent(createPgusDto.newPgu),
          );
          this.logger.log('PGU created, now init' + createPgusDto);
          this.logger.log('response ' + res.data.response + res.status);
          this.onboardPGU(createPgusDto.newPgu.id);
        } else if (res.status === 403) {
          throw new UnauthorizedException();
        } else {
          console.log('error: ' + JSON.stringify(res.status));
        }
      });
  }

  async findAll(token: string) {
    console.log('getting pgus ! ....');
    const body = {
      method: PgusService.PGUMonitorContractMethod.getAllPGUs,
      args: [],
    };
    const res$ = this.httpService.post(
      this.pgusQueryUrl,
      JSON.stringify(body),
      {
        headers: { Authorization: token },
      },
    );

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
      method: PgusService.PGUMonitorContractMethod.getPGU,
      args: [id.toString()],
    };
    const res$ = this.httpService.post(
      this.pgusQueryUrl,
      JSON.stringify(body),
      {
        headers: { Authorization: token },
      },
    );

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
      method: PgusService.PGUMonitorContractMethod.submitMeasurePGU,
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
      .pipe
      // tap((_) => this.log(`added pgu id=${pgu.id}`)),
      //catchError(this.handleError<any>('addPGU')),
      ()
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
      method: PgusService.PGUMonitorContractMethod.getMeasurePGU,
      args: [id.toString(), expectedTime.toString()],
    };
    this.httpService
      .post(this.pgusInvokeUrl, JSON.stringify(body), {
        headers: { Authorization: 'Bearer ' + this.authService.getApiToken() },
      })
      .pipe
      // tap((_) => this.log(`added pgu id=${pgu.id}`)),
      //catchError(this.handleError<any>('addPGU')),
      ()
      .subscribe((res) => {
        if (res.status === 201 || res.status === 200) {
          let measure: MeasureEvent;
          const pguUpdate: PguStateUpdateDto = JSON.parse(res.data.response);
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
                this.submitConstraint(
                  id,
                  pguUpdate.onBoardPercentage * measure.measuredPower,
                );
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

  submitConstraint(id: number, constraint: number) {
    this.logger.log('constraining pgu ! ....');
    const now: Date = new Date();
    const applicationTime: Date = new Date(now.getTime() + 60 * 5 * 1000);
    const body = {
      method: PgusService.PGUMonitorContractMethod.submitConstraint,
      args: [id.toString(), constraint.toString(), applicationTime.toString()],
    };
    this.httpService
      .post(this.pgusInvokeUrl, JSON.stringify(body), {
        headers: { Authorization: 'Bearer ' + this.authService.getApiToken() },
      })
      .pipe
      // tap((_) => this.log(`added pgu id=${pgu.id}`)),
      //catchError(this.handleError<any>('addPGU')),
      ()
      .subscribe((res) => {
        if (res.status === 201 || res.status === 200) {
          this.logger.log('constraint submitted ! ....');
        } else if (res.status === 403) {
          throw new UnauthorizedException();
        } else {
          this.logger.warn('error: ' + JSON.stringify(res.status));
        }
      });
  }

  async getConstraint(id: number) {
    this.logger.log('checking for constraint pgu ! ....');
    const body = {
      method: PgusService.PGUMonitorContractMethod.getConstraint,
      args: [id.toString()],
    };
    const res$ = this.httpService
      .post(this.pgusQueryUrl, JSON.stringify(body), {
        headers: { Authorization: 'Bearer ' + this.authService.getApiToken() },
      })
      .pipe
      // tap((_) => this.log(`added pgu id=${pgu.id}`)),
      //catchError(this.handleError<any>('addPGU')),
      ();
    const res = await lastValueFrom(res$);
    if (res.status === 201 || res.status === 200) {
      return res.data.response;
    } else if (res.status === 403) {
      throw new UnauthorizedException();
    } else {
      this.logger.warn('error: ' + JSON.stringify(res.status));
    }
  }
}
