import { Test, TestingModule } from '@nestjs/testing';
import { VehiculesService } from './vehicules.service';
import { ImageKitService } from './imagekit.service';

describe('VehiculesService', () => {
  let service: VehiculesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehiculesService, ImageKitService],
    }).compile();

    service = module.get<VehiculesService>(VehiculesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
