import { Entity, Column, ObjectID } from "typeorm";
import { IChannel } from "../types";
import BaseEntity from "./BaseEntity";
import User from "./User";
// import User from "./User";
import Video from "./Video";

// TODO: Many-to-many channel/user relationship

/**
 * A channel is the only entity that can upload videos, users either own or have access to channels.
 */
@Entity()
export default class Channel extends BaseEntity implements IChannel {
  constructor(handle: string, displayName: string) {
    super();
    this.handle = handle;
    this.displayName = displayName;
    // this.owner = owner;
    this.videos = [];
  }

  @Column()
  public handle: string;

  @Column()
  public displayName: string;

  // @Column((type) => ObjectID)
  // owner: ObjectID;

  @Column((type) => Video)
  videos: Video[];
}
