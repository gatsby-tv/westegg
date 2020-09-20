import { Entity, Column } from "typeorm";
import BaseEntity from "./BaseEntity";

export const HANDLE_MAX_LENGTH = 16;
export const DISPLAY_NAME_MAX_LENGTH = 64;
export const EMAIL_MAX_LENGTH = 64;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const ENCRYPTED_PASSWORD_MAX_LENGTH = 256;

@Entity()
export default class User extends BaseEntity {

  constructor(handle: string, displayName: string, email: string, password: string) {
    super();
    this.handle = handle;
    this.displayName = displayName;
    this.email = email;
    this.password = password;
  }

  @Column({ length: HANDLE_MAX_LENGTH })
  public handle: string;

  @Column({ length: DISPLAY_NAME_MAX_LENGTH, name: "display_name" })
  public displayName: string;

  @Column({ length: EMAIL_MAX_LENGTH })
  public email: string;

  @Column({ length: ENCRYPTED_PASSWORD_MAX_LENGTH })
  public password: string;
}
