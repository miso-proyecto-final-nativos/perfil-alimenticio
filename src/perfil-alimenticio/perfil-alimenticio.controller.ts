import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  RequestTimeoutException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { plainToInstance } from 'class-transformer';
import {
  catchError,
  firstValueFrom,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';
import {
  BusinessError,
  BusinessLogicException,
} from 'src/shared/errors/business-errors';
import { BusinessErrorsInterceptor } from 'src/shared/interceptors/business-errors.interceptor';
import { PerfilAlimenticioDto } from './dto/perfil-alimenticio.dto';
import { AuthGuard } from './guards/auth.guard';
import { PerfilAlimenticioEntity } from './model/perfil-alimenticio.entity';
import { PerfilAlimenticioService } from './perfil-alimenticio.service';

@UseInterceptors(BusinessErrorsInterceptor)
@Controller('perfil-alimenticio')
export class PerfilAlimenticioController {
  constructor(
    @Inject('MS_CATALOGO_SERVICE') private clienteCatalogoService: ClientProxy,
    @Inject('USER_MS') private clienteUsuarioService: ClientProxy,
    private readonly perfilAlimenticioService: PerfilAlimenticioService,
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  async healthCheck() {
    return this.health.check([async () => this.db.pingCheck('database')]);
  }

  @UseGuards(AuthGuard)
  @Get(':idDeportista')
  async findByDeportistaId(@Param('idDeportista') idDeportista: number) {
    return await this.perfilAlimenticioService.findByDeportistaId(idDeportista);
  }

  @UseGuards(AuthGuard)
  @Post(':idDeportista')
  async create(
    @Param('idDeportista') idDeportista: number,
    @Body() perfilAlimenticioDto: PerfilAlimenticioDto,
  ) {
    await this.validarIdDeportista(idDeportista);
    await this.validarTipoDieta(perfilAlimenticioDto.tipoDieta);
    await this.validarDatosperfilAlimenticio(perfilAlimenticioDto);
    perfilAlimenticioDto.idDeportista = idDeportista;
    const perfilDeportivoEntity: PerfilAlimenticioEntity = plainToInstance(
      PerfilAlimenticioEntity,
      perfilAlimenticioDto,
    );
    return await this.perfilAlimenticioService.create(perfilDeportivoEntity);
  }

  @UseGuards(AuthGuard)
  @Put(':idDeportista')
  async update(
    @Param('idDeportista') idDeportista: number,
    @Body() perfilAlimenticioDto: PerfilAlimenticioDto,
  ) {
    await this.validarTipoDieta(perfilAlimenticioDto.tipoDieta);
    await this.validarDatosperfilAlimenticio(perfilAlimenticioDto);
    perfilAlimenticioDto.idDeportista = idDeportista;
    const perfilAlimenticioEntity: PerfilAlimenticioEntity = plainToInstance(
      PerfilAlimenticioEntity,
      perfilAlimenticioDto,
    );
    return await this.perfilAlimenticioService.update(
      idDeportista,
      perfilAlimenticioEntity,
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':idDeportista')
  @HttpCode(204)
  async delete(@Param('idDeportista') idDeportista: number) {
    return await this.perfilAlimenticioService.delete(idDeportista);
  }

  private async validarDatosperfilAlimenticio(
    perfilAlimenticioDto: PerfilAlimenticioDto,
  ) {
    const idAlimentoNoToleradoNoValido = await this.validarAlimentos(
      perfilAlimenticioDto.alimentosNoTolereados,
    );
    if (idAlimentoNoToleradoNoValido) {
      throw new BusinessLogicException(
        `No se encontró el alimento no tolerado con el id ${idAlimentoNoToleradoNoValido}`,
        BusinessError.PRECONDITION_FAILED,
      );
    }
    const idAlimentoPreferenciaNoValido = await this.validarAlimentos(
      perfilAlimenticioDto.alimentosPreferencia,
    );
    if (idAlimentoPreferenciaNoValido) {
      throw new BusinessLogicException(
        `No se encontró el alimento de preferencia con el id ${idAlimentoPreferenciaNoValido}`,
        BusinessError.NOT_FOUND,
      );
    }
  }

  private async validarIdDeportista(idDeportista: number) {
    const molestia$ = this.clienteUsuarioService
      .send({ role: 'user', cmd: 'getById' }, { idDeportista })
      .pipe(
        timeout(5000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            return throwError(() => new RequestTimeoutException());
          }
          return throwError(() => err);
        }),
      );

    const molestia = await firstValueFrom(molestia$);

    if (!molestia) {
      throw new BusinessLogicException(
        `No se encontró un deportista con el id ${idDeportista}`,
        BusinessError.NOT_FOUND,
      );
    }
  }

  private async validarAlimentos(alimentos: number[]) {
    let idAlimentoNoValido = undefined;
    for (let i = 0; i < alimentos.length; i++) {
      try {
        const alimentoId = alimentos[i];
        const alimento$ = this.clienteCatalogoService
          .send(
            { role: 'alimento', cmd: 'getById' },
            { alimentoId: alimentoId },
          )
          .pipe(
            timeout(5000),
            catchError((err) => {
              if (err instanceof TimeoutError) {
                return throwError(() => new RequestTimeoutException());
              }
              return throwError(() => err);
            }),
          );

        const alimento = await firstValueFrom(alimento$);

        if (!alimento) {
          throw new BusinessLogicException(
            `No se encontró el alimento con el id ${alimentoId}`,
            BusinessError.NOT_FOUND,
          );
        }
      } catch (error) {
        idAlimentoNoValido = alimentos[i];
        break;
      }
    }
    return idAlimentoNoValido;
  }

  private async validarTipoDieta(idTipoDieta: number) {
    const tipoDieta$ = this.clienteCatalogoService
      .send({ role: 'tipoDieta', cmd: 'getById' }, { idTipoDieta: idTipoDieta })
      .pipe(
        timeout(5000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            return throwError(() => new RequestTimeoutException());
          }
          return throwError(() => err);
        }),
      );

    const tipoDieta = await firstValueFrom(tipoDieta$);

    if (!tipoDieta) {
      throw new BusinessLogicException(
        `No se encontró un tipo de dieta con el id ${idTipoDieta}`,
        BusinessError.NOT_FOUND,
      );
    }
  }
}
