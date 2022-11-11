import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import { Repository } from 'typeorm';
import { PerfilAlimenticioEntity } from './model/perfil-alimenticio.entity';

@Injectable()
export class PerfilAlimenticioService {
  constructor(
    @InjectRepository(PerfilAlimenticioEntity)
    private readonly perfilAlimenticioRepository: Repository<PerfilAlimenticioEntity>,
  ) {}

  async findByDeportistaId(
    idDeportista: number,
  ): Promise<PerfilAlimenticioEntity> {
    const perfilAlimenticio: PerfilAlimenticioEntity =
      await this.perfilAlimenticioRepository.findOne({
        where: { idDeportista: idDeportista },
      });
    if (!perfilAlimenticio)
      throw new BusinessLogicException(
        'No se encontró un perfil alimenticio para el id de deportista suministrado',
        BusinessError.NOT_FOUND,
      );
    return perfilAlimenticio;
  }

  async create(
    perfilAlimenticio: PerfilAlimenticioEntity,
  ): Promise<PerfilAlimenticioEntity> {
    await this.validarIdDeportista(perfilAlimenticio.idDeportista);
    return await this.perfilAlimenticioRepository.save(perfilAlimenticio);
  }

  private async validarIdDeportista(idDeportista: number) {
    const perfilAlimenticio: PerfilAlimenticioEntity =
      await this.perfilAlimenticioRepository.findOne({
        where: { idDeportista: idDeportista },
      });
    if (perfilAlimenticio)
      throw new BusinessLogicException(
        `Ya existe un perfil alimenticio asociado al id ${perfilAlimenticio.idDeportista}`,
        BusinessError.PRECONDITION_FAILED,
      );
  }

  async update(
    idDeportista: number,
    perfilAlimenticio: PerfilAlimenticioEntity,
  ): Promise<PerfilAlimenticioEntity> {
    const persistedPerfilAlimenticio: PerfilAlimenticioEntity =
      await this.perfilAlimenticioRepository.findOne({
        where: { idDeportista: idDeportista },
      });
    if (!persistedPerfilAlimenticio) {
      throw new BusinessLogicException(
        'No se encontró un perfil alimenticio con el id suministrado',
        BusinessError.NOT_FOUND,
      );
    }
    return await this.perfilAlimenticioRepository.save({
      ...persistedPerfilAlimenticio,
      ...perfilAlimenticio,
    });
  }

  async delete(idDeportista: number) {
    const perfilAlimenticio: PerfilAlimenticioEntity =
      await this.perfilAlimenticioRepository.findOne({
        where: { idDeportista: idDeportista },
      });
    if (!perfilAlimenticio) {
      throw new BusinessLogicException(
        'No se encontró un perfil alimenticio con el id suministrado',
        BusinessError.NOT_FOUND,
      );
    }
    await this.perfilAlimenticioRepository.delete(perfilAlimenticio);
  }
}
