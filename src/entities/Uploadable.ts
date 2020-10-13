// /**
//  * Abstract entity that can be extended to implement another entity that can you can upload videos to.
//  * An example of this would be a channel, many videos can be uploaded to one channel, so a channel is Uploadable.
//  */
// import { Column, Entity, OneToMany } from "typeorm";
// import BaseEntity from "./BaseEntity";
// import Video from "./Video";

// export const DISPLAY_NAME_MAX_LENGTH = 64;

// @Entity()
// export default abstract class Uploadable extends BaseEntity {
//   constructor(displayName: string) {
//     super();
//     this.displayName = displayName;
//   }

//   @Column({
//     type: "varchar",
//     length: DISPLAY_NAME_MAX_LENGTH,
//     name: "display_name"
//   })
//   public displayName: string;

//   @OneToMany((type) => Video, (video) => video.uploadable)
//   public videos?: Video[];
// }
