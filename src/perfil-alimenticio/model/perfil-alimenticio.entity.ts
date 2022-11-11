import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PerfilAlimenticioEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  idDeportista: number;

  @Column({ array: true })
  alimentosNoTolereados?: number;

  @Column()
  tipoDieta?: number;

  @Column({ array: true })
  alimentosPreferencia?: number;
}
