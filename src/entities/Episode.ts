// import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
// import Show from "./Show";
// import Uploadable from "./Uploadable";
// import Video from "./Video";

// @Entity()
// export default class Episode extends Video {
//   constructor(
//     season: number,
//     index: number,
//     title: string,
//     description: string,
//     views: number,
//     dateUploaded: Date,
//     hash: string,
//     thumbnailHash: string,
//     uploadable: Uploadable
//   ) {
//     super(
//       title,
//       description,
//       views,
//       dateUploaded,
//       hash,
//       thumbnailHash,
//       uploadable
//     );
//     this.season = season;
//     this.index = index;
//   }

//   @Column({ type: "numeric" })
//   public season: number;

//   @Column({ type: "numeric" })
//   public index: number;

//   @OneToMany((type) => Episode, (episode) => episode.season)
//   public videos?: Episode[];

//   @ManyToOne((type) => Show, (show) => show.episodes)
//   @JoinColumn({ name: "show" })
//   public show?: Show;

//   toJSON() {
//     const video = super.toJSON();
//     return {
//       index: this.index,
//       ...video
//     };
//   }
// }
