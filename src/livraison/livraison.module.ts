import { Module } from '@nestjs/common';
import { LivraisonController } from './livraison.controller';
import { LivraisonService } from './livraison.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LivraisonController],
  providers: [LivraisonService],
  exports: [LivraisonService],
})
export class LivraisonModule {}
