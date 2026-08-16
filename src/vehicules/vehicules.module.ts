import { Module } from '@nestjs/common';
import { VehiculesService } from './vehicules.service';
import { VehiculesController } from './vehicules.controller';
import { DatabaseModule } from '../database/database.module';
import { ImageKitService } from './imagekit.service';

@Module({
  imports: [DatabaseModule],
  controllers: [VehiculesController],
  providers: [VehiculesService, ImageKitService],
  exports: [VehiculesService, ImageKitService],
})
export class VehiculesModule {}
