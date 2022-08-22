// eslint-disable-next-line prettier/prettier
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PgusService } from './pgus.service';
import { CreatePgusDto } from './dto/create-pgus.dto';
import { UpdatePgusDto } from './dto/update-pgus.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { TokenAuthGuard } from 'src/auth/guards/token.guard';
import { GetConstraintRequest } from './dto/get-constraint.request';
import { Constraint } from './entities/constraint';

@Controller('pgus')
export class PgusController {
  constructor(private readonly pgusService: PgusService) {}

  @UseGuards(TokenAuthGuard)
  @Post()
  create(@Body() createPgusDto: CreatePgusDto, @Request() req) {
    return this.pgusService.create(createPgusDto, req.headers.authorization);
  }

  @UseGuards(TokenAuthGuard)
  @Post('constraint/:id')
  submitConstraint(
    @Param('id') id: string,
    @Body() constraint: Constraint,
    @Request() req,
  ) {
    return this.pgusService.submitConstraint(
      id,
      constraint,
      req.headers.authorization,
    );
  }

  @UseGuards(TokenAuthGuard)
  @Get('alert/:id')
  async declareAlert(@Param('id') id: string, @Request() req) {
    return await this.pgusService.declareAlert(id, req.headers.authorization);
  }

  @UseGuards(TokenAuthGuard)
  @Get('urgency/:id')
  async declareUrgency(@Param('id') id: string, @Request() req) {
    return await this.pgusService.declareUrgency(id, req.headers.authorization);
  }

  @UseGuards(TokenAuthGuard)
  @Get()
  async findAll(@Request() req) {
    return await this.pgusService.findAll(req.headers.authorization);
  }

  @UseGuards(TokenAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.pgusService.findOne(+id, req.headers.authorization);
  }

  @UseGuards(TokenAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePgusDto: UpdatePgusDto) {
    return this.pgusService.update(+id, updatePgusDto);
  }

  @UseGuards(TokenAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pgusService.remove(+id);
  }

  @EventPattern('pgu-measures')
  handlePowerMeasure(data: any) {
    this.pgusService.handlePowerMeasure(data.value);
  }

  @MessagePattern('get_constraint')
  async getConstraint(data: any) {
    return await this.pgusService.getConstraint(data.value.id);
  }
}
