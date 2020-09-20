import { BaseEntity, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default abstract class Base extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: string;

  public abstract toJSON(): object;
}
