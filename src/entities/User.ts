import { Entity, Column, ObjectIdColumn, ObjectID } from "typeorm";
import { IUser } from "../types";
// import Channel from "./Channel";

// export const HANDLE_MAX_LENGTH = 16;
// export const DISPLAY_NAME_MAX_LENGTH = 64;
// export const EMAIL_MAX_LENGTH = 64;
// export const PASSWORD_MIN_LENGTH = 8;
// export const PASSWORD_MAX_LENGTH = 64;
// export const ENCRYPTED_PASSWORD_MAX_LENGTH = 256;

@Entity()
export default class User implements IUser {
  constructor(
    id: ObjectID,
    handle: string,
    displayName: string,
    email: string,
    password: string
  ) {
    this.id = id;
    this.handle = handle;
    this.displayName = displayName;
    this.email = email;
    this.password = password;
    // this.channels = [];
  }

  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  public handle: string;

  @Column()
  public displayName: string;

  @Column()
  public email: string;

  @Column()
  public password: string;

  // @Column()
  // public channels: string[];
}
