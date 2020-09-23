import { Entity, Column, OneToMany } from "typeorm";
import { IUser } from "../types";
import BaseEntity from "./BaseEntity";
import Channel from "./Channel";

export const HANDLE_MAX_LENGTH = 16;
export const DISPLAY_NAME_MAX_LENGTH = 64;
export const EMAIL_MAX_LENGTH = 64;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const ENCRYPTED_PASSWORD_MAX_LENGTH = 256;

@Entity()
export default class User extends BaseEntity implements IUser {
  constructor(
    handle: string,
    displayName: string,
    email: string,
    password: string
  ) {
    super();
    this.handle = handle;
    this.displayName = displayName;
    this.email = email;
    this.password = password;
  }

  @Column({ type: "varchar", length: HANDLE_MAX_LENGTH })
  public handle: string;

  @Column({
    type: "varchar",
    length: DISPLAY_NAME_MAX_LENGTH,
    name: "display_name"
  })
  public displayName: string;

  @Column({ type: "varchar", length: EMAIL_MAX_LENGTH })
  public email: string;

  @Column({ type: "varchar", length: ENCRYPTED_PASSWORD_MAX_LENGTH })
  public password: string;

  @OneToMany((type) => Channel, (channel) => channel.owner)
  public channels?: Channel[];

  toJSON() {
    return {
      id: this.id,
      handle: this.handle,
      displayName: this.displayName,
      email: this.email
    };
  }
}
