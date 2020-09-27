import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import Episode from "./Episode";
import Show from "./Show";
import Uploadable from "./Uploadable";

@Entity()
export default class Season extends Uploadable {
  constructor(index: number) {
    super();
    this.index = index;
  }

  @Column({ type: "numeric" })
  public index: number;

  @ManyToOne((type) => Show, (show) => show.seasons)
  @JoinColumn({ name: "show" })
  public show?: Show;

  @OneToMany((type) => Episode, (episode) => episode.season)
  public videos?: Episode[];

  toJSON() {
    const episodes = this.videos!.map((video) => {
      return video.toJSON();
    });

    return {
      show: this.show!.name,
      index: this.index,
      episodes
    };
  }
}
