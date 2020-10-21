import { Entity, Column } from "typeorm";
import { IHandled, INamed } from "../types";
import BaseEntity from "./BaseEntity";
import Channel from "./Channel";

@Entity()
export default class User extends BaseEntity implements IHandled, INamed {
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
    this.channels = [];
  }

  @Column()
  public handle: string;

  @Column()
  public displayName: string;

  @Column()
  public email: string;

  // Allow null/undefined to delete when sending IUser back to the client
  @Column()
  public password?: string;

  @Column((type) => Channel)
  public channels: Channel[];
}
