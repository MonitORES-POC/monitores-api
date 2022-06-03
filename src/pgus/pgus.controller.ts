// eslint-disable-next-line prettier/prettier
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PgusService } from './pgus.service';
import { CreatePgusDto } from './dto/create-pgus.dto';
import { UpdatePgusDto } from './dto/update-pgus.dto';
import { EventPattern } from '@nestjs/microservices';

@Controller('pgus')
export class PgusController {
  constructor(private readonly pgusService: PgusService) {}

  @Post()
  create(@Body() createPgusDto: CreatePgusDto) {
    return this.pgusService.create(createPgusDto);
  }

  @Get()
  findAll() {
    return this.pgusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pgusService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePgusDto: UpdatePgusDto) {
    return this.pgusService.update(+id, updatePgusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pgusService.remove(+id);
  }

  @EventPattern('pgu-1')
  handlePowerMeasure(data: any) {
    this.pgusService.handlePowerMeasure(data.value);
  }
}
