import { PartialType } from '@nestjs/mapped-types';
import { CreatePgusDto } from './create-pgus.dto';

export class UpdatePgusDto extends PartialType(CreatePgusDto) {}
