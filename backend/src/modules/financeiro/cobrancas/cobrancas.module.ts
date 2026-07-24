import { Module } from '@nestjs/common';
import { CobrancasService } from './cobrancas.service';
import { CobrancasController } from './cobrancas.controller';

@Module({
  controllers: [CobrancasController],
  providers: [CobrancasService],
})
export class CobrancasModule {}