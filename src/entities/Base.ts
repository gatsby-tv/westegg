import { BaseEntity, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class Base extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: string;
}
