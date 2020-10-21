import {
  BaseEntity as TypeORMBaseEntity,
  ObjectID,
  ObjectIdColumn
} from "typeorm";

export default abstract class BaseEntity extends TypeORMBaseEntity {
  @ObjectIdColumn()
  public _id?: ObjectID;
}
