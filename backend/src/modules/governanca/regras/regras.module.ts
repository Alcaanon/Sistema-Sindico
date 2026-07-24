import { Module } from '@nestjs/common';
import { RegrasService } from './regras.service';
import { RegrasController } from './regras.controller';

@Module({
  controllers: [RegrasController],
  providers: [RegrasService],
})
export class RegrasModule {}