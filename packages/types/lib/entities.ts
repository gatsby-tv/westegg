import { Report } from "@lib/report";
import {
  AdminSettings,
  ChannelSettings,
  ModeratorSettings,
  UserSettings
} from "@lib/settings";
import {
  AccountInfo,
  AccountTrust,
  CategoryInfo,
  ChannelID,
  CID,
  ContentInfo,
  Contributions,
  IPFSContent,
  PlaylistID,
  Promotions,
  ReceivedInvites,
  SentInvites,
  ShowBookmarks,
  ShowID,
  UserID,
  VideoBookmarks,
  VideoID
} from "@lib/shared";

/*
 * Additional metadata specific to channel accounts.
 */
export interface IChannelAccount extends AccountInfo, AccountTrust {
  readonly _id: ChannelID;
  subscribers: number;
  poster?: IPFSContent | string;
}

/*
 * `IChannelPublicInfo` is used primarily to list users that are publically
 * associated with the channel.
 *
 * All channels must have at least one owner at all times.
 */
export interface IChannelPublicInfo {
  readonly _id: ChannelID;
  owners: Array<UserID>;
  collaborators: Array<UserID>;
  contributors: Array<UserID>;
  contributions: Contributions;
  publicAdmins: Array<UserID>;
  publicModerators: Array<UserID>;
}

/*
 * `IChannelPrivateInfo` is used for storing data relating to how the
 * channel is managed and the current settings for both the channel itself
 * as well as any admins and moderators.
 *
 * Users listed in `management.{admin,moderator}` include users who are
 * both publically and privately managing the channel.
 */
export interface IChannelPrivateInfo {
  readonly _id: ChannelID;
  settings: Array<ChannelSettings>;
  invitations: SentInvites;
  management: {
    admin: {
      users: Array<UserID>;
      settings: AdminSettings;
    };
    moderation: {
      users: Array<UserID>;
      settings: ModeratorSettings;
    };
  };
}

/*
 * Lists all of the content that a channel has created/uploaded.
 *
 * Note that `videos` includes IDs for both `IBasicVideo` and
 * `ISerialVideo` objects, but does not include any IDs instances of
 * `IEpisodicVideo`.
 */
export interface IChannelContent {
  readonly _id: ChannelID;
  videos: Array<VideoID>;
  shows: Array<ShowID>;
  playlists: Array<PlaylistID>;
}

export type IChannel = IChannelAccount &
  IChannelPublicInfo &
  IChannelPrivateInfo &
  IChannelContent;

/*
 * Additional metadata specific to user accounts.
 */
export interface IUserAccount extends AccountInfo, AccountTrust {
  readonly _id: UserID;
  followers: number;
}

/*
 * `IUserPublicInfo` lists channels that are associated with the user.
 */
export interface IUserPublicInfo {
  readonly _id: UserID;
  channels: Array<ChannelID>;
  collaborations: Array<ChannelID>;
}

/*
 * `IUserPrivateInfo` holds the settings and contact information of a user.
 */
export interface IUserPrivateInfo {
  readonly _id: UserID;
  email: string;
  administering: Array<ChannelID>;
  moderating: Array<ChannelID>;
  settings: Array<UserSettings>;
  invitations: ReceivedInvites;
}

/*
 * Subscriptions and followed users are listed in `IUserContentFeeds`.
 *
 * The name "Content Feed" isn't quite appropriate and could be misleading.
 */
export interface IUserContentFeeds {
  readonly _id: UserID;
  following: Array<UserID>;
  subscriptions: Array<ChannelID>;
}

/*
 * User watch history.
 *
 * Watch history is split between videos and shows, but requires each to
 * be strictly ordered into the same list. Consequently, videos listed in
 * `history` does not include episodic videos.
 */
export interface IUserHistory {
  readonly _id: UserID;
  history: Array<{ video: VideoID } | { show: ShowID }>;
  bookmarks: {
    videos: VideoBookmarks;
    shows: ShowBookmarks;
  };
}

/*
 * `IUserPromotions` stores a single item used for determining whether
 * a user has already promoted a video/show or not so as to prevent users
 * from promoting a video or show multiple times.
 */
export interface IUserPromotions {
  readonly _id: UserID;
  promotions: Promotions;
}

export type IUser = IUserAccount &
  IUserPublicInfo &
  IUserPrivateInfo &
  IUserContentFeeds &
  IUserHistory &
  IUserPromotions;

/*
 * `IBasicVideo` is the base datatype for video content.
 * On its own, `IBasicVideo` represents a single video that is not
 * associated with a playlist or show.
 *
 * Additionally, the `creationDate` key belonging to `ContentInfo` is
 * replaced with `releaseDate`. This is to suggest the slight increase
 * in flexability to its value. Namely, `releaseDate` is allowed to
 * have values that extend into the future --- indicating that a video
 * has been scheduled to be released to the public at a specific
 * day/time. This is useful for creators who stick to a predefined
 * schedule for video releases and have content backlogged in advance.
 */
export interface IBasicVideo extends Omit<ContentInfo, "creationDate"> {
  readonly _id: VideoID;
  readonly releaseDate: Date;
  content: CID;
  duration: number;
  next?: VideoID;
  previous?: VideoID;
  contributors: Array<UserID>;
  contributions: Contributions;
  sponsors: Array<UserID>;
}

/*
 * An `ISerialVideo` represents a video that belongs to a playlist.
 *
 * While serial videos store category info, it is expected
 * that each serial video will share the category info as the
 * playlist they belong to. The data is duplicated here to make
 * search  queries easier.
 */
export interface ISerialVideo extends IBasicVideo {
  playlist: PlaylistID;
}

/*
 * An `IEpisodciVideo` represents a video that belongs to a show.
 *
 * There are a few distinctions however. Specifically, since episodes of
 * a show cannot be discovered on their own, there is no need for them to
 * extend `CategoryInfo` or keep track of promotions.
 */
export interface IEpisodicVideo
  extends Omit<IBasicVideo, keyof CategoryInfo | "promotions"> {
  show: ShowID;
}

export type IVideo = IBasicVideo | ISerialVideo | IEpisodicVideo;

/*
 * An `IVideoReport` records user submitted complaints regarding a video.
 */
export type IVideoReport = { readonly _id: VideoID } & Record<Report, number>;

/*
 * An individual season of a show.
 */
export interface ISeason {
  title?: string;
  episodes: Array<VideoID>;
}

/*
 * The first of the two types of show wherein the show isn't segregated
 * into seasons. Making this varient of show equivalent to a sorted playlist.
 * Consequently, it is important that we have introduced a distinct `episodes`
 * key so that this object can be distinguished from `IPlaylist` when
 * observing an instance of `ICollection`.
 */
export interface IEpisodicShow extends ContentInfo {
  readonly _id: ShowID;
  episodes: Array<VideoID>;
}

/*
 * The second type of show is segregated into seasons using the `ISeason`
 * datatype above.
 */
export interface ISeasonedShow extends ContentInfo {
  readonly _id: ShowID;
  seasons: Array<ISeason>;
}

export type IShow = ISeasonedShow | IEpisodicShow;

/*
 * `IPlaylist` represents an unordered list of videos. Videos belonging
 * to a playlist may be discovered individually, but may optionally be
 * binged together.
 *
 * Since videos of a playlist may be discovered, they themselves are
 * promoted individually. As such, the playlist itself does not keep
 * track of promotions.
 */
export interface IPlaylist extends Omit<ContentInfo, "promotions"> {
  readonly _id: PlaylistID;
  videos: Array<VideoID>;
}

export type ICollection = IShow | IPlaylist;
