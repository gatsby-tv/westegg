import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import BaseEntity from "./BaseEntity";
import User from "./User";

export const HANDLE_MAX_LENGTH = 16;
export const DISPLAY_NAME_MAX_LENGTH = 64;

/**
 * A channel is the only entity that can upload videos, users either own or have access to channels.
 */

@Entity()
export default class Channel extends BaseEntity {
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

  // TODO:
  // videos: Video[]
  // shows: Show[]
  // series: Series[]
  // sequences: Sequence[]

  toJSON() {
    return {
      id: this.id,
      handle: this.handle,
      displayName: this.displayName,
      owner: this.owner.toJSON()
    };
  }
}
