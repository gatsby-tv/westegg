/**
 * Abstract entity that can be extended to implement another entity that can you can upload videos to.
 * An example of this would be a channel, many videos can be uploaded to one channel, so a channel is Uploadable.
 */
import { Entity, OneToMany } from "typeorm";
import BaseEntity from "./BaseEntity";
import Video from "./Video";

@Entity()
export default abstract class Uploadable extends BaseEntity {
  @OneToMany((type) => Video, (video) => video.uploadable)
  public videos?: Video[];
}
