import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class PerfilAlimenticioDto {
  @IsNumber()
  id: number;

  @IsNumber()
  @IsNotEmpty()
  idDeportista: number;

  @IsArray()
  alimentosNoTolereados?: number[];

  @IsNumber()
  tipoDieta?: number;

  @IsArray()
  alimentosPreferencia?: number[];
}
