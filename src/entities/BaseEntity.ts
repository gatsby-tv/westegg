import {
  BaseEntity as TypeORMBaseEntity,
  PrimaryGeneratedColumn
} from "typeorm";

export default abstract class BaseEntity extends TypeORMBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id?: string;

  public abstract toJSON(): object;
}
