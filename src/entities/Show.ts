// import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
// import Channel from "./Channel";
// import Episode from "./Episode";
// import Uploadable from "./Uploadable";

// @Entity()
// export default class Show extends Uploadable {
//   constructor(displayName: string) {
//     super(displayName);
//   }

//   @ManyToOne((type) => Channel, (channel) => channel.shows)
//   @JoinColumn({ name: "channel" })
//   public channel?: Channel;

//   @OneToMany((type) => Episode, (episode) => episode.show)
//   public episodes?: Episode[];

//   toJSON() {
//     return {};
//   }
// }
