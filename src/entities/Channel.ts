// import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
// import Sequence from "./Sequence";
// import Series from "./Series";
// import Show from "./Show";
// import Uploadable from "./Uploadable";
// // import User from "./User";
// import Video from "./Video";

// export const HANDLE_MAX_LENGTH = 16;

// /**
//  * A channel is the only entity that can upload videos, users either own or have access to channels.
//  */
// @Entity()
// export default class Channel extends Uploadable {
//   constructor(handle: string, displayName: string, owner: User) {
//     super(displayName);
//     this.handle = handle;
//     this.owner = owner;
//   }

//   @Column()
//   public handle: string;

//   @ManyToOne((type) => User, (user) => user.channels)
//   @JoinColumn({ name: "owner" })
//   owner: User;

//   @OneToMany((type) => Video, (video) => video.uploadable)
//   videos?: Video[];

//   @OneToMany((type) => Show, (show) => show.channel)
//   shows?: Show[];

//   @OneToMany((type) => Series, (series) => series)
//   serieses?: Series[];

//   @OneToMany((type) => Sequence, (sequence) => sequence)
//   sequences?: Sequence[];

//   toJSON() {
//     return {
//       id: this.id,
//       handle: this.handle,
//       displayName: this.displayName,
//       owner: this.owner.toJSON()
//     };
//   }
// }
