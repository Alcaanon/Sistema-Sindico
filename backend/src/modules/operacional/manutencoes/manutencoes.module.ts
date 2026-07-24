import { Module } from '@nestjs/common';
import { ManutencoesService } from './manutencoes.service';
import { ManutencoesController } from './manutencoes.controller';

@Module({
  controllers: [ManutencoesController],
  providers: [ManutencoesService],
})
export class ManutencoesModule {}