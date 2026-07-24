import { Module } from '@nestjs/common';
import { FechamentosService } from './fechamentos.service';
import { FechamentosController } from './fechamentos.controller';

@Module({
  controllers: [FechamentosController],
  providers: [FechamentosService],
})
export class FechamentosModule {}