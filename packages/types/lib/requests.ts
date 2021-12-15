import {
  IBasicVideo,
  IChannelAccount,
  IEpisodicShow,
  IPlaylist,
  ISeasonedShow,
  ISerialVideo,
  IShow,
  IUserAccount,
  IUserPrivateInfo,
  IVideo
} from "@lib/entities";
import { AdminPermissions } from "@lib/permissions";
import { Report } from "@lib/report";
import {
  ChannelSettings,
  ModerationSettings,
  UserSettings
} from "@lib/settings";
import {
  ChannelID,
  CID,
  ObjectID,
  SignInKeyID,
  UserID,
  VideoID
} from "@lib/shared";

//
// Generic Requests
// --------------------------------------------------
export type CursorRequest = {
  cursor?: ObjectID;
  limit?: number;
};

//
// Authentication Requests
// --------------------------------------------------

/*
 * POST /auth/signin
 *
 * Send a magic link to the user's email to get a valid JWT.
 * This magic link should be formatted as `/magiclink?key=<signin_key>&exist=<user_exists>`.
 */
export type PostAuthSignInRequest = Pick<IUserPrivateInfo, "email">;

/*
 * GET /auth/signin/:key
 *
 * Get a JWT to complete a signin from a magic link.
 */
export type GetAuthSignInKeyRequest = { key: SignInKeyID };

/*
 * POST /auth/signin/:key/persist
 */
export type PostAuthPersistSignInKeyRequestParams = { key: SignInKeyID };
export type PostAuthPersistSignInKeyRequest = {};

/*
 * GET /auth/token/refresh
 *
 * Requires authorization.
 *
 * Use the current JWT to get a new JWT to prevent the current from expiring.
 * On page load the frontend should send this request and set the new token from the response.
 */
export type GetAuthTokenRefreshRequest = {};

/*
 * POST /auth/token/invalidate
 *
 * Invalidate all tokens issued for the user before the time this request is set.
 */
export type PostAuthInvalidateAllPreviousTokensRequestParams = {};
export type PostAuthInvalidateAllPreviousTokensRequest = {};

//
// User Requests
// --------------------------------------------------

/*
 * POST /user
 *
 * Request to finish creating a new user from the specified handle and display name. Requires a signin key from a magic link (sent by email).
 */
export type PostUserCompleteSignupRequestParams = {};
export type PostUserCompleteSignupRequest = Pick<
  IUserAccount,
  "handle" | "name"
> & {
  key: SignInKeyID;
};

/*
 * GET /user/{:id,:handle}
 */
export type GetUserAccountRequest = {
  unique: UserID | string;
};

/*
 * GET /user/:handle/exists
 */
export type GetUserHandleExistsRequest = { handle: string };

/*
 * GET /user/:id/public
 */
export type GetUserPublicRequest = {
  id: UserID;
};

/*
 * GET /user/:id/private
 */
export type GetUserPrivateRequest = {
  id: UserID;
};

/*
 * GET /user/:id/feeds
 */
export type GetUserFeedsRequest = {
  id: UserID;
};

/*
 * GET /user/:id/history
 */
export type GetUserHistoryRequest = {
  id: UserID;
};

/*
 * GET /user/:id/promotions
 */
export type GetUserPromotionsRequest = {
  id: UserID;
};

/*
 * GET /user/:id/listing/recommended
 */
export type GetUserListingRecommendedRequest = { id: UserID };
export type GetUserListingRecommendedRequestQuery = CursorRequest;

/*
 * GET /user/:id/listing/subscriptions
 */
export type GetUserListingSubscriptionsRequest = { id: UserID };
export type GetUserListingSubscriptionsRequestQuery = CursorRequest;

/**
 * GET /user/:id/channels
 */
export type GetUserChannelsRequestParams = { id: UserID };

/*
 * PUT /user/:id
 */
export type PutUserRequestParams = { id: UserID };
export type PutUserRequest = Partial<
  Pick<IUserAccount, "name" | "handle" | "description">
>;

/*
 * PUT /user/:id/avatar
 */
export type PutUserAvatarRequestParams = { id: UserID };
export type PutUserAvatarRequest = {};

/*
 * PUT /user/:id/banner
 */
export type PutUserBannerRequestParams = { id: UserID };
export type PutUserBannerRequest = {};

/*
 * PUT /user/:id/subscription
 */
export type PutUserSubscriptionRequestParams = { id: UserID };
export type PutUserSubscriptionRequest = {
  subscription: ChannelID;
};

/*
 * PUT /user/:id/follow
 */
export type PutUserFollowingRequestParams = { id: UserID };
export type PutUserFollowingRequest = {
  follow: UserID;
};

/*
 * PUT /user/:id/history
 */
export type PutUserHistoryRequestParams = { id: UserID };
export type PutUserHistoryRequest = {
  video: VideoID;
  bookmark: number;
};

/*
 * PUT /user/:id/promotion
 */
export type PutUserPromotionRequestParams = { id: UserID };
export type PutUserPromotionRequest = { video: VideoID };

/*
 * PUT /user/:id/settings
 */
export type PutUserSettingsRequestParams = { id: UserID };
export type PutUserSettingsRequest = { settings: Array<UserSettings> };

/*
 * PUT /user/:id/owner/accept
 */
export type PutUserOwnerAcceptRequestParams = { id: UserID };
export type PutUserOwnerAcceptRequest = { channel: ChannelID };

/*
 * PUT /user/:id/collaboration/accept
 */
export type PutUserCollaborationAcceptRequestParams = { id: UserID };
export type PutUserCollaborationAcceptRequest = { channel: ChannelID };

/*
 * PUT /user/:id/admin/accept
 */
export type PutUserAdminAcceptRequestParams = { id: UserID };
export type PutUserAdminAcceptRequest = { channel: ChannelID };

/*
 * PUT /user/:id/moderation/accept
 */
export type PutUserModerationAcceptRequestParams = { id: UserID };
export type PutUserModerationAcceptRequest = { channel: ChannelID };

/*
 * DELETE /user/:id
 */
export type DeleteUserRequestParams = { id: UserID };
export type DeleteUserRequest = {};

/*
 * DELETE /user/:id/subscription
 */
export type DeleteUserSubscriptionRequestParams = { id: UserID };
export type DeleteUserSubscriptionRequest = { channel: ChannelID };

/*
 * DELETE /user/:id/follow
 */
export type DeleteUserFollowRequestParams = { id: UserID };
export type DeleteUserFollowRequest = { follow: UserID };

/*
 * DELETE /user/:id/history
 */
export type DeleteUserHistoryRequestParams = { id: UserID };
export type DeleteUserHistoryRequest = { video: VideoID };

/*
 * DELETE /user/:id/history/all
 */
export type DeleteUserEntireHistoryRequestParams = { id: UserID };
export type DeleteUserEntireHistoryRequest = {};

/*
 * DELETE /user/:id/promotion
 */
export type DeleteUserPromotionRequestParams = { id: UserID };
export type DeleteUserPromotionRequest = { video: VideoID };

/*
 * DELETE /user/:id/collaboration
 */
export type DeleteUserCollaborationRequestParams = { id: UserID };
export type DeleteUserCollaborationRequest = { channel: ChannelID };

/*
 * DELETE /user/:id/admin
 */
export type DeleteUserAdminRequestParams = { id: UserID };
export type DeleteUserAdminRequest = { channel: ChannelID };

/*
 * DELETE /user/:id/moderator
 */
export type DeleteUserModeratorRequestParams = { id: UserID };
export type DeleteUserModeratorRequest = { channel: ChannelID };

/*
 * DELETE /user/:id/collaboration/invite
 */
export type DeleteUserCollaborationInviteRequestParams = { id: UserID };
export type DeleteUserCollaborationInviteRequest = { channel: ChannelID };

/*
 * DELETE /user/:id/admin/invite
 */
export type DeleteUserAdminInviteRequestParams = { id: UserID };
export type DeleteUserAdminInviteRequest = { channel: ChannelID };

/*
 * DELETE /user/:id/moderator/invite
 */
export type DeleteUserModeratorInviteRequestParams = { id: UserID };
export type DeleteUserModeratorInviteRequest = { channel: ChannelID };

//
// Channel Requests
// --------------------------------------------------

/*
 * POST /channel
 */
export type PostChannelRequest = Pick<IChannelAccount, "handle" | "name"> & {
  owner: UserID;
};

/*
 * GET /channel/{:id,:handle}
 */
export type GetChannelAccountRequest = { unique: string };

/*
 * GET /channel/:handle/exists
 */
export type GetChannelHandleExistsRequest = { handle: string };

/*
 * GET /channel/:id/public
 */
export type GetChannelPublicRequest = {};

/*
 * GET /channel/:id/private
 */
export type GetChannelPrivateRequest = {};

/*
 * GET /channel/:id/content
 */
export type GetChannelContentRequest = { id: ChannelID };

/*
 * GET /channel/:id/videos
 */
export type GetChannelVideosRequest = { id: ChannelID };
export type GetChannelVideosRequestQuery = CursorRequest;

/*
 * GET /channel/:id/playlists
 */
export type GetChannelPlaylistsRequest = { id: ChannelID };
export type GetChannelPlaylistsRequestQuery = CursorRequest;

/*
 * GET /channel/:id/shows
 */
export type GetChannelShowsRequest = { id: ChannelID };
export type GetChannelShowsRequestQuery = CursorRequest;

/*
 * PUT /channel/:id
 */
export type PutChannelRequest = Partial<
  Pick<IChannelAccount, "name" | "description">
>;

/*
 * PUT /channel/:id/handle
 */
export type PutChannelHandleRequestParams = { id: string };
export type PutChannelHandleRequest = { handle: string };

/*
 * PUT /channel/:id/avatar
 */
export type PutChannelAvatarRequestParams = { id: string };
export type PutChannelAvatarRequest = {};

/*
 * PUT /channel/:id/banner
 */
export type PutChannelBannerRequestParams = { id: string };
export type PutChannelBannerRequest = {};

/*
 * PUT /channel/:id/poster
 */
export type PutChannelPosterRequestParams = { id: string };
export type PutChannelPosterRequest = {};

/*
 * PUT /channel/:id/settings
 */
export type PutChannelSettingsRequestParams = { id: string };
export type PutChannelSettingsRequest = { settings: Array<ChannelSettings> };

/*
 * PUT /channel/:id/owner/invite
 */
export type PutChannelOwnerInviteRequest = { owners: Array<UserID> };

/*
 * PUT /channel/:id/collaborator/invite
 */
export type PutChannelCollaboratorInviteRequest = {
  collaborators: Array<UserID>;
};

/*
 * PUT /channel/:id/contributor/invite
 */
export type PutChannelContributorInviteRequest = {
  contributors: Array<UserID>;
};

/*
 * PUT /channel/:id/contributor/roles
 */
export type PutChannelContributorRolesRequest = {
  contributor: UserID;
  roles: Array<string>;
};

/*
 * PUT /channel/:id/admin/invite
 */
export type PutChannelAdminInviteRequest = { admins: Array<UserID> };

/*
 * PUT /channel/:id/admin/settings
 */
export type PutChannelAdminSettingsRequest = {
  admin: UserID;
  permissions: Array<AdminPermissions>;
};

/*
 * PUT /channel/:id/moderator/invite
 */
export type PutChannelModeratorInviteRequest = { moderators: Array<UserID> };

/*
 * PUT /channel/:id/moderator/settings
 */
export type PutChannelModeratorSettingsRequest = {
  moderator: UserID;
  moderations: ModerationSettings;
};

/*
 * DELETE /channel/:id/owner
 */
export type DeleteChannelOwnerRequest = { owner: UserID };

/*
 * DELETE /channel/:id/collaborator
 */
export type DeleteChannelCollaboratorRequest = { collaborator: UserID };

/*
 * DELETE /channel/:id/contributor
 */
export type DeleteChannelContributorRequest = { contributor: UserID };

/*
 * DELETE /channel/:id/admin
 */
export type DeleteChannelAdminRequest = { admin: UserID };

/*
 * DELETE /channel/:id/moderator
 */
export type DeleteChannelModeratorRequest = { moderator: UserID };

/*
 * DELETE /channel/:id/owner/invite
 */
export type DeleteChannelOwnerInviteRequest = { owner: UserID };

/*
 * DELETE /channel/:id/collaborator/invite
 */
export type DeleteChannelCollaboratorInviteRequest = { collaborator: UserID };

/*
 * DELETE /channel/:id/contributor/invite
 */
export type DeleteChannelContributorInviteRequest = { contributor: UserID };

/*
 * DELETE /channel/:id/admin/invite
 */
export type DeleteChannelAdminInviteRequest = { admin: UserID };

/*
 * DELETE /channel/:id/moderator/invite
 */
export type DeleteChannelModeratorInviteRequest = { moderator: UserID };

//
// Video Requests
// --------------------------------------------------

/*
 * POST /video
 */
export type PostVideoRequest = Omit<
  IBasicVideo | ISerialVideo,
  "_id" | "releaseDate" | "views"
>;

/*
 * GET /video/:id
 */
export type GetVideoRequest = { id: string };

/*
 * GET /video/:id/listing/related
 */
export type GetVideoListingRelatedRequest = {};
export type GetVideoListingRelatedRequestQuery = CursorRequest;

/*
 * PUT /video/:id
 */
export type PutVideoRequestParams = { id: VideoID };
export type PutVideoRequest = Partial<
  Omit<IVideo, "_id" | "releaseDate" | "content" | "views" | "channel">
>;

/*
 * PUT /video/:id/view
 */
export type PutVideoViewRequestParams = { id: VideoID };
export type PutVideoViewRequest = {};

/*
 * PUT /video/:id/content
 */
export type PutVideoContentRequest = {
  duration: number;
  content: CID;
};

/*
 * PUT /video/:id/report
 */
export type PutVideoReportRequest = {
  report: Report;
};

/*
 * DELETE /video/:id
 */
export type DeleteVideoRequest = {
  id: VideoID;
};

//
// Video Tag Requests
// --------------------------------------------------

/*
 * GET /video/:id/tags
 */
export type GetTagsRequest = { id: VideoID };

/*
 * POST /video/:id/tags
 */
export type PostTagsRequestParams = { id: VideoID };
export type PostTagsRequest = {
  tags: string[];
};

/*
 * DELETE /video/:id/tags
 */
export type DeleteTagsRequestParams = { id: VideoID };
export type DeleteTagsRequest = {
  tags: string[];
};

//
// Show Requests
// --------------------------------------------------

/*
 * POST /show
 */
export type PostShowRequest = Omit<IShow, "_id" | "creationDate" | "views">;

/*
 * POST /show/:id/episode
 */
export type PostShowEpisodeRequest = {
  season?: number;
  episode: PostVideoRequest;
};

/*
 * GET /show/:id
 */
export type GetShowRequest = {};

/*
 * PUT /show/:id
 */
export type PutShowRequest = Partial<
  Omit<
    IShow,
    "_id" | "creationDate" | "views" | "channel" | "episodes" | "seasons"
  >
>;

/*
 * PUT /show/:id/episode
 */
export type PutShowEpisodeRequest = {
  season?: number;
  episode: VideoID;
};

/*
 * PUT /show/:id/content
 */
export type PutShowContentRequest =
  | Pick<ISeasonedShow, "seasons">
  | Pick<IEpisodicShow, "episodes">;

/*
 * DELETE /show/:id
 */
export type DeleteShowRequest = {};

//
// Playlist Requests
// --------------------------------------------------

/*
 * POST /playlist
 */
export type PostPlaylistRequest = Omit<
  IPlaylist,
  "_id" | "creationDate" | "views"
>;

/*
 * GET /playlist/:id
 */
export type GetPlaylistRequest = {};

/*
 * PUT /playlist/:id
 */
export type PutPlaylistRequest = Partial<
  Omit<IPlaylist, "_id" | "creationDate" | "views" | "channel" | "videos">
>;

/*
 * PUT /playlist/:id/content
 */
export type PutPlaylistContentRequest = Pick<IPlaylist, "videos">;

/*
 * DELETE /playlist/:id
 */
export type DeletePlaylistRequest = {};

//
// Listing Requests
// --------------------------------------------------

/*
 * GET /listing/featured/channels
 */
export type GetListingFeaturedChannelsRequest = {};

/*
 * GET /listing/videos/popular
 */
export type GetListingPopularVideosRequest = {};
export type GetListingPopularVideosRequestQuery = CursorRequest;

/*
 * GET /listing/videos/tags
 */
export type GetListingVideosWithTagsRequest = {};
export type GetListingVideosWithTagsRequestQuery = {
  tags: string[];
} & CursorRequest;

/*
 * GET /listing/videos/new
 */
export type GetListingNewVideosRequest = {};
export type GetListingNewVideosRequestQuery = CursorRequest;
