/*
 * Object IDs as used in MongoDB.
 *
 * Type aliases are used to aide the readability of other types,
 * distinguishing what kind of object the ID refers to.
 */
export type ObjectID = string;
export type SignInKeyID = ObjectID;
export type UserID = ObjectID;
export type ChannelID = ObjectID;
export type VideoID = ObjectID;
export type ShowID = ObjectID;
export type PlaylistID = ObjectID;

export type JWT = string;

/*
 * Type aliases for distinguishing strings used in IPFS related content.
 */
export type CID = string;
export type MimeType = string;

/*
 * `IPFSContent` refers to the data needed to fetch a file from IPFS and
 * create a URL from the resulting blob.
 */
export type IPFSContent = {
  hash: CID;
  mimeType: MimeType;
};

/*
 * Generic data associated with accounts (channels and users).
 *
 * For Users, this data will not be provided when they first sign up. Initially,
 * sign up will instead create a user login token in a separate MongoDB database
 * dedicated to authentication. Nonetheless, if this data is not present when a
 * user attempts to login, the frontend will redirect to a page for supplying this
 * information.
 */
export interface AccountInfo {
  avatar: IPFSContent | string;
  banner?: IPFSContent | string;
  handle: string;
  name: string;
  description: string;
  creationDate: Date;
}

/*
 * Flags for indicating an account's standing on the platform. All values
 * default to false/undefined.
 *
 * `verified`: indicates that an account is to be treated with highest degree of
 * respect and consideration. Often used to cement an account as representing an
 * established brand or public identity.
 *
 * `trusted`: indicates that a channel or user has proven to act in good faith.
 * Accounts that are not trusted are far more likely to suspected of botting or
 * uploading inappropriate/copyrighted content.
 *
 * `banned`: indicates that an account has been publically announced to no longer
 * be welcome on the platform. Bans are always administered by either invoking,
 * creating, or replacing a community precedent.
 */
export interface AccountTrust {
  verified?: boolean;
  trusted?: boolean;
  banned?: boolean;
}

/*
 * Data for categorizing and searching content.
 */
export interface CategoryInfo {
  tags: Array<string>;
  explicit?: boolean;
  unlisted?: boolean;
}

/*
 * `ContentInfo` includes important metadata for content.
 */
export interface ContentInfo extends CategoryInfo {
  readonly creationDate: Date;
  title: string;
  description: string;
  views: number;
  promotions: number;
  channel: ChannelID;
  collaborators: Array<UserID>;
  thumbnail: IPFSContent;
}

/*
 * `Contributions` lists the various roles that a contributor
 * had performed in the production of a video. This dictionary
 * is keyed using UserIDs.
 */
export type Contributions = {
  [user: string]: Array<string>;
};

/*
 * A `VideoBookmark` provides a timestamp for when a user stopped
 * watching a particular video. Here the `timestamp` key is
 * taken to be the *percentage* of the video that has been
 * watched. This way, bookmarks do not depend on the durations
 * of the videos themselves.
 *
 * If `part` is not specified, it is assumed to default to the
 * first IPFS hash provided in `IBasicVideo`.
 */
export type VideoBookmark = {
  part?: number;
  timestamp: number;
};

/*
 * A collection of `VideoBookmark` objects associated with the VideoIDs
 * in a user's watch history.
 */
export type VideoBookmarks = {
  [video: string]: VideoBookmark;
};

/*
 * A `ShowBookmark` provides a timestamp for when a user stopped
 * watching a particular show.
 */
export type ShowBookmark = {
  season?: number;
  episode: number;
  part?: number;
  timestamp: number;
};

/*
 * A collection of `ShowBookmark` objects associated with the ShowIDs
 * in a user's watch history.
 */
export type ShowBookmarks = {
  [show: string]: ShowBookmark;
};

/*
 * The `Promotions` collection provides the means for identifying
 * whether a particular user has already promoted a video/show or not.
 * This allows us to prevent users from promoting a video more than once.
 *
 * In the future, we intend to convert this to a dictionary whose value
 * is `number` instead. This will come when we implement a more sophisticated
 * promotion system.
 *
 * This is one of the few cases where multiple types of IDs are used
 * interchangeably. Namely, `VideoID`s and `ShowID`s.
 */
export type Promotions = {
  [id: string]: boolean;
};

/*
 * `SentInvites` keeps track of all of the invitations sent by a channel
 * to various users to be included in different channel roles.
 */
export type SentInvites = {
  owners: Array<UserID>;
  collaborators: Array<UserID>;
  admins: Array<UserID>;
  moderators: Array<UserID>;
};

/*
 * `ReceivedInvites`, likewise, keeps track of all of the invitations received
 * by a user by various channels to be included in different channel roles.
 */
export type ReceivedInvites = {
  owners: Array<ChannelID>;
  collaborators: Array<ChannelID>;
  admin: Array<ChannelID>;
  moderator: Array<ChannelID>;
};
