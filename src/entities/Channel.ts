import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import Show from "./Show";
import Uploadable from "./Uploadable";
import User from "./User";

export const HANDLE_MAX_LENGTH = 16;
export const DISPLAY_NAME_MAX_LENGTH = 64;

/**
 * A channel is the only entity that can upload videos, users either own or have access to channels.
 */
@Entity()
export default class Channel extends Uploadable {
  constructor(handle: string, displayName: string, owner: User) {
    super();
    this.handle = handle;
    this.displayName = displayName;
    this.owner = owner;
  }

  @Column({ type: "varchar", length: HANDLE_MAX_LENGTH })
  public handle: string;

  @Column({
    type: "varchar",
    length: DISPLAY_NAME_MAX_LENGTH,
    name: "display_name"
  })
  public displayName: string;

  @ManyToOne((type) => User, (user) => user.channels)
  @JoinColumn({ name: "owner" })
  owner: User;

  @OneToMany((type) => Show, (show) => show.channel)
  shows?: Show[];

  // TODO:
  // series?: Series[]
  // sequences?: Sequence[]

  toJSON() {
    return {
      id: this.id,
      handle: this.handle,
      displayName: this.displayName,
      owner: this.owner.toJSON()
    };
  }
}
