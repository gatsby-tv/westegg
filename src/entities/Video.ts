import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import BaseEntity from "./BaseEntity";
import Uploadable from "./Uploadable";

export const TITLE_MAX_LENGTH = 128;
export const DESCRIPTION_MAX_LENGTH = 2048;
export const IPFS_HASH_MAX_LENGTH = 46;

@Entity()
export default class Video extends BaseEntity {
  constructor(
    title: string,
    description: string,
    views: number,
    dateUploaded: Date,
    hash: string,
    thumbnailHash: string,
    uploadable: Uploadable
  ) {
    super();
    this.title = title;
    this.description = description;
    this.views = views;
    this.dateUploaded = dateUploaded;
    this.hash = hash;
    this.thumbnailHash = thumbnailHash;
    this.uploadable = uploadable;
  }

  @Column({ type: "varchar", length: TITLE_MAX_LENGTH })
  public title: string;

  @Column({ type: "varchar", length: DESCRIPTION_MAX_LENGTH })
  public description: string;

  @Column({ type: "numeric" })
  public views: number;

  @CreateDateColumn({ type: "timestamp", name: "date_uploaded" })
  public readonly dateUploaded: Date;

  @Column({ type: "varchar", length: IPFS_HASH_MAX_LENGTH })
  public hash: string;

  @Column({ type: "varchar", length: IPFS_HASH_MAX_LENGTH })
  public thumbnailHash: string;

  // Many-To-One relationship with Uploadable entity (abstract entity we can upload videos to)
  @ManyToOne((type) => Uploadable, (uploadable) => uploadable.videos)
  @JoinColumn({ name: "uploadable" })
  public uploadable: Uploadable;

  // TODO:
  // Comments

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      views: this.views,
      dateUploaded: this.dateUploaded,
      hash: this.hash,
      thumbnailHash: this.thumbnailHash,
      uploadable: this.uploadable.toJSON()
    };
  }
}
