import { PartialType } from '@nestjs/swagger';
import { CreateManutencaoDto } from './create-manutencao.dto';

export class UpdateManutencaoDto extends PartialType(CreateManutencaoDto) {}