import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { PguStateUpdateDto } from './pgus/dto/pgu-state-update.dto';
import { StateBufferService } from './pgus/state-buffer/state-buffer.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MeasureGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private stateBufferService: StateBufferService) {}
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('MeasureGateway');

  @SubscribeMessage('get_buffer')
  handleMessage(client: Socket, payload: string): void {
    const id: number = payload['id'];
    this.server
      .to(client.id)
      .emit(
        'send_buffer',
        JSON.stringify(this.stateBufferService.getBuffer(id)),
      );
  }

  sendMeasuresToClients(pguUpdate: PguStateUpdateDto) {
    try {
      this.server.to(pguUpdate.id.toString());
      this.server.emit('update_state_event', pguUpdate);
    } catch (error) {
      this.logger.error(error);
    }
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    const { id } = client.handshake.query;
    client.join(id);
    this.logger.log(`Client connected: ${client.id} to PGU ${id}`);
  }
}
