import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import Season from "./Season";
import Uploadable from "./Uploadable";
import Video from "./Video";

@Entity()
export default class Episode extends Video {
  constructor(
    index: number,
    title: string,
    description: string,
    views: number,
    dateUploaded: Date,
    hash: string,
    thumbnailHash: string,
    uploadable: Uploadable
  ) {
    super(
      title,
      description,
      views,
      dateUploaded,
      hash,
      thumbnailHash,
      uploadable
    );
    this.index = index;
  }

  @Column({ type: "numeric" })
  public index: number;

  @ManyToOne((type) => Season, (season) => season.videos)
  @JoinColumn({ name: "season" })
  public season?: Season;

  @OneToMany((type) => Episode, (episode) => episode.season)
  public videos?: Episode[];

  toJSON() {
    const video = super.toJSON();
    return {
      index: this.index,
      ...video
    };
  }
}
