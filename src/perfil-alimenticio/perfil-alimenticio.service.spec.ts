import { Test, TestingModule } from '@nestjs/testing';
import { PerfilAlimenticioService } from './perfil-alimenticio.service';

describe('PerfilAlimenticioService', () => {
  let service: PerfilAlimenticioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PerfilAlimenticioService],
    }).compile();

    service = module.get<PerfilAlimenticioService>(PerfilAlimenticioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
