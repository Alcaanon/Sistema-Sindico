import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUnidadeDto } from './create-unidade.dto';

export class UpdateUnidadeDto extends PartialType(OmitType(CreateUnidadeDto, ['numero'] as const)) {}