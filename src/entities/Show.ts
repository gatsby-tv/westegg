import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import Channel from "./Channel";
import Season from "./Season";
import Uploadable from "./Uploadable";

export const SHOW_NAME_MAX_LENGTH = 64;

@Entity()
export default class Show extends Uploadable {
  constructor(name: string) {
    super();
    this.name = name;
  }

  @Column({ type: "varchar", length: SHOW_NAME_MAX_LENGTH })
  public name: string;

  @ManyToOne((type) => Channel, (channel) => channel.shows)
  @JoinColumn({ name: "channel" })
  public channel?: Channel;

  @OneToMany((type) => Season, (season) => season.show)
  public seasons?: Season[];

  toJSON() {
    const seasons = this.seasons!.map((season) => {
      return season.toJSON();
    });

    return {
      name: this.name,
      seasons
    };
  }
}
