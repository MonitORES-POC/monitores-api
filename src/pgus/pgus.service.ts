import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ClientKafka } from '@nestjs/microservices';
import { AppConstants } from 'src/app.constants';
import { MeasureGateway } from 'src/measure.gateway';
import { CreatePgusDto } from './dto/create-pgus.dto';
import { UpdatePgusDto } from './dto/update-pgus.dto';
import { createPguEvent } from './events/create-pgu.event';
import { MeasureEvent } from './events/measure.event';

@Injectable()
export class PgusService {
  private pgusUrl = `${AppConstants.FABLO_API}${AppConstants.smartContractQueryPoint}`;
  private static readonly PGUMonitorContractMethod = {
    createPGU: 'MonitorPGUContract:CreatePGU',
    getPGU: 'MonitorPGUContract:GetPGU',
    deletePGU: 'MonitorPGUContract:DeletePGU',
    getAllPGUs: 'MonitorPGUContract:GetAllPGUs',
  };

  constructor(
    private measureGateway: MeasureGateway,
    @Inject('PGU_SIMULATOR_SERVICE')
    private readonly pguSimulatorClient: ClientKafka,
    private httpService: HttpService,
  ) {}

  create(createPgusDto: CreatePgusDto) {
    const body = {
      // TODO refactor all smart contracts bodies
      method: PgusService.PGUMonitorContractMethod.createPGU,
      args: [
        createPgusDto.newPgu.id,
        createPgusDto.newPgu.owner,
        createPgusDto.newPgu.sourceTypeId,
        createPgusDto.newPgu.installedPower,
        createPgusDto.newPgu.contractPower,
      ],
    };
    this.httpService
      .post(this.pgusUrl, JSON.stringify(body))
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
          console.log(createPgusDto);
        } else {
          console.log('error: ' + JSON.stringify(res.data));
        }
      });
  }

  findAll() {
    return `This action returns all pgus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pgus`;
  }

  update(id: number, updatePgusDto: UpdatePgusDto) {
    return `This action updates a #${id} pgus`;
  }

  remove(id: number) {
    return `This action removes a #${id} pgus`;
  }

  handlePowerMeasure(measure: MeasureEvent) {
    console.log(
      measure.measuredPower +
        ' ' +
        measure.timeStamp +
        ' : measure received in api gateway',
    );
    this.measureGateway.sendMeasuresToClients(measure);
  }
}
