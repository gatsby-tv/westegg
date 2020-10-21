import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { IVideo } from "../types";
import BaseEntity from "./BaseEntity";

// export const TITLE_MAX_LENGTH = 128;
// export const DESCRIPTION_MAX_LENGTH = 2048;
// export const IPFS_HASH_MAX_LENGTH = 46;

@Entity()
export default class Video extends BaseEntity implements IVideo {
  constructor(
    title: string,
    description: string,
    views: number,
    dateUploaded: Date,
    hash: string,
    thumbnailHash: string
  ) {
    super();
    this.title = title;
    this.description = description;
    this.views = views;
    this.dateUploaded = dateUploaded;
    this.hash = hash;
    this.thumbnailHash = thumbnailHash;
  }

  @Column()
  public title: string;

  @Column()
  public description: string;

  @Column()
  public views: number;

  @CreateDateColumn()
  public readonly dateUploaded: Date;

  @Column()
  public hash: string;

  @Column()
  public thumbnailHash: string;

  // TODO:
  // Comments
}
