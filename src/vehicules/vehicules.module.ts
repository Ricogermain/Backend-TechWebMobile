import { Module } from '@nestjs/common';
import { VehiculesService } from './vehicules.service';
import { VehiculesController } from './vehicules.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VehiculesController],
  providers: [VehiculesService],
  exports: [VehiculesService],
})
export class VehiculesModule {}