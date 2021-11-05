import { ObjectID } from "@lib/shared";
import {
  Browsable,
  BrowsableVideo,
  Channel,
  ChannelContent,
  ChannelPrivateInfo,
  ChannelPublicInfo,
  EncodedToken,
  Playlist,
  Show,
  User,
  UserContentFeeds,
  UserHistory,
  UserPrivateInfo,
  UserPromotions,
  UserPublicInfo,
  Video
} from "@lib/types";

export type Cursor<T = {}> = {
  content: Array<T>;
  cursor: ObjectID | undefined;
  limit: number;
};

//
// Authentication Responses
// --------------------------------------------------

/*
 * POST /auth/signin
 *
 * This will come back as 200 OK no matter what (barring no internal errors), as to not indicate if the email the magic link was sent to exists or not.
 */
export type PostAuthSignInResponse = { key?: string };

/*
 * GET /auth/signin/:key
 */
export type GetAuthSignInKeyResponse = { token: EncodedToken };

/*
 * POST /auth/signin/:key/persist
 *
 * This response will always give a 200 OK even if the signin key doesn't exist as to not let the client know if a signin key exists or not.
 */
export type PostAuthPersistSignInKeyResponse = {};

/*
 * GET /auth/token/refresh
 */
export type GetAuthTokenRefreshResponse = { token: EncodedToken };

/*
 * POST /auth/token/invalidate
 */
export type PostAuthInvalidateAllPreviousTokensResponse = {};

//
// User Responses
// --------------------------------------------------

/*
 * POST /user
 */
export type PostAuthCompleteSignUpResponse = { token: EncodedToken };

/*
 * GET /user/{:id,:handle}
 */
export type GetUserAccountResponse = User;

/*
 * GET /user/:handle/exists
 */
export type GetUserHandleExistsResponse = User;

/*
 * GET /user/:id/public
 */
export type GetUserPublicResponse = UserPublicInfo;

/*
 * GET /user/:id/private
 */
export type GetUserPrivateResponse = UserPrivateInfo;

/*
 * GET /user/:id/feeds
 */
export type GetUserFeedsResponse = UserContentFeeds;

/*
 * GET /user/:id/history
 */
export type GetUserHistoryResponse = UserHistory;

/*
 * GET /user/:id/promotions
 */
export type GetUserPromotionsResponse = UserPromotions;

/*
 * GET /user/:id/listing/recommended
 */
export type GetUserListingRecommendedResponse = Cursor<Browsable>;

/*
 * GET /user/:id/listing/subscriptions
 */
export type GetUserListingSubscriptionsResponse = Cursor<BrowsableVideo>;

/*
 * GET /user/:id/channels
 */
export type GetUserChannelsResponse = Array<Channel>;

/*
 * PUT /user/:id
 */
export type PutUserResponse = {};

/*
 * PUT /user/:id/avatar
 */
export type PutUserAvatarResponse = User;

/*
 * PUT /user/:id/banner
 */
export type PutUserBannerResponse = User;

/*
 * PUT /user/:id/subscription
 */
export type PutUserSubscriptionResponse = User;

/*
 * PUT /user/:id/follow
 */
export type PutUserFollowResponse = {};

/*
 * PUT /user/:id/history
 */
export type PutUserHistoryResponse = {};

/*
 * PUT /user/:id/promotion
 */
export type PutUserPromotionResponse = {};

/*
 * PUT /user/:id/settings
 */
export type PutUserSettingsResponse = {};

/*
 * PUT /user/:id/owner/accept
 */
export type PutUserOwnerAcceptResponse = {};

/*
 * PUT /user/:id/collaboration/accept
 */
export type PutUserCollaborationAcceptResponse = {};

/*
 * PUT /user/:id/admin/accept
 */
export type PutUserAdminAcceptResponse = {};

/*
 * PUT /user/:id/moderator/accept
 */
export type PutUserModeratorAcceptResponse = {};

/*
 * DELETE /user/:id
 */
export type DeleteUserResponse = {};

/*
 * DELETE /user/:id/subscription
 */
export type DeleteUserSubscriptionResponse = {};

/*
 * DELETE /user/:id/follow
 */
export type DeleteUserFollowResponse = {};

/*
 * DELETE /user/:id/history
 */
export type DeleteUserHistoryResponse = {};

/*
 * DELETE /user/:id/history/all
 */
export type DeleteUserEntireHistoryResponse = {};

/*
 * DELETE /user/:id/promotion
 */
export type DeleteUserPromotionResponse = {};

/*
 * DELETE /user/:id/collaboration
 */
export type DeleteUserCollaborationResponse = {};

/*
 * DELETE /user/:id/admin
 */
export type DeleteUserAdminResponse = {};

/*
 * DELETE /user/:id/moderator
 */
export type DeleteUserModeratorResponse = {};

/*
 * DELETE /user/:id/owner/invite
 */
export type DeleteUserOwnerInviteResponse = {};

/*
 * DELETE /user/:id/collaboration/invite
 */
export type DeleteUserCollaborationInviteResponse = {};

/*
 * DELETE /user/:id/admin/invite
 */
export type DeleteUserAdminInviteResponse = {};

/*
 * DELETE /user/:id/moderator/invite
 */
export type PutUserModeratorInviteResponse = {};

//
// Channel Responses
// --------------------------------------------------

/*
 * POST /channel
 */
export type PostChannelResponse = Channel;

/*
 * GET /channel/{:id,:handle}
 */
export type GetChannelAccountResponse = Channel;

/*
 * GET /channel/:handle/exists
 */
export type GetChannelHandleExistsResponse = Channel;

/*
 * GET /channel/:id/public
 */
export type GetChannelPublicResponse = ChannelPublicInfo;

/*
 * GET /channel/:id/private
 */
export type GetChannelPrivateResponse = ChannelPrivateInfo;

/*
 * GET /channel/:id/content
 */
export type GetChannelContentResponse = ChannelContent;

/*
 * GET /channel/:id/videos
 */
export type GetChannelVideosResponse = Cursor<Video>;

/*
 * GET /channel/:id/playlists
 */
export type GetChannelPlaylistsResponse = Cursor<Playlist>;

/*
 * GET /channel/:id/shows
 */
export type GetChannelShowsResponse = Cursor<Show>;

/*
 * PUT /channel/:id
 */
export type PutChannelResponse = {};

/*
 * PUT /channel/:id/handle
 */
export type PutChannelHandleResponse = {};

/*
 * PUT /channel/:id/avatar
 */
export type PutChannelAvatarResponse = Channel;

/*
 * PUT /channel/:id/banner
 */
export type PutChannelBannerResponse = Channel;

/*
 * PUT /channel/:id/poster
 */
export type PutChannelPosterResponse = Channel;

/*
 * PUT /channel/:id/owner/invite
 */
export type PutChannelOwnerInviteResponse = {};

/*
 * PUT /channel/:id/collaborator/invite
 */
export type PutChannelCollaboratorInviteResponse = {};

/*
 * PUT /channel/:id/contributor/invite
 */
export type PutChannelContributorInviteResponse = {};

/*
 * PUT /channel/:id/contributor/roles
 */
export type PutChannelContributorRolesResponse = {};

/*
 * PUT /channel/:id/admin/invite
 */
export type PutChannelAdminInviteResponse = {};

/*
 * PUT /channel/:id/admin/settings
 */
export type PutChannelAdminSettingsResponse = {};

/*
 * PUT /channel/:id/moderator/invite
 */
export type PutChannelModeratorInviteResponse = {};

/*
 * PUT /channel/:id/moderator/settings
 */
export type PutChannelModeratorSettingsResponse = {};

/*
 * DELETE /channel/:id
 */
export type DeleteChannelResponse = {};

/*
 * DELETE /channel/:id/owner
 */
export type DeleteChannelOwnerResponse = {};

/*
 * DELETE /channel/:id/collaborator
 */
export type DeleteChannelCollaboratorResponse = {};

/*
 * DELETE /channel/:id/contributor
 */
export type DeleteChannelContributorResponse = {};

/*
 * DELETE /channel/:id/admin
 */
export type DeleteChannelAdminResponse = {};

/*
 * DELETE /channel/:id/moderator
 */
export type DeleteChannelModeratorResponse = {};

/*
 * DELETE /channel/:id/owner/invite
 */
export type DeleteChannelOwnerInviteResponse = {};

/*
 * DELETE /channel/:id/collaborator/invite
 */
export type DeleteChannelCollaboratorInviteResponse = {};

/*
 * DELETE /channel/:id/contributor/invite
 */
export type DeleteChannelContributorInviteResponse = {};

/*
 * DELETE /channel/:id/admin/invite
 */
export type DeleteChannelAdminInviteResponse = {};

/*
 * DELETE /channel/:id/moderator/invite
 */
export type DeleteChannelModeratorInviteResponse = {};

//
// Video Responses
// --------------------------------------------------

/*
 * POST /video
 */
export type PostVideoResponse = Video;

/*
 * GET /video/:id
 */
export type GetVideoResponse = Video;

/*
 * GET /video/:id/listing/related
 */
export type GetVideoListingRelatedResponse = Cursor<Browsable>;

/*
 * PUT /video/:id
 */
export type PutVideoResponse = Video;

/*
 * PUT /video/:id/view
 */
export type PutVideoViewResponse = {};

/*
 * PUT /video/:id/content
 */
export type PutVideoContentResponse = {};

/*
 * PUT /video/:id/report
 */
export type PutVideoReportResponse = {};

/*
 * DELETE /video/:id
 */
export type DeleteVideoResponse = {};

//
// Show Responses
// --------------------------------------------------

/*
 * POST /show
 */
export type PostShowResponse = {};

/*
 * POST /show/:id/episode
 */
export type PostShowEpisodeResponse = {};

/*
 * GET /show/:id
 */
export type GetShowResponse = Show;

/*
 * PUT /show/:id
 */
export type PutShowResponse = {};

/*
 * PUT /show/:id/episode
 */
export type PutShowEpisodeResponse = {};

/*
 * PUT /show/:id/content
 */
export type PutShowContentResponse = {};

/*
 * DELETE /show/:id
 */
export type DeleteShowResponse = {};

//
// Playlist Responses
// --------------------------------------------------

/*
 * POST /playlist
 */
export type PostPlaylistResponse = {};

/*
 * GET /playlist/:id
 */
export type GetPlaylistResponse = Playlist;

/*
 * PUT /playlist/:id
 */
export type PutPlaylistResponse = {};

/*
 * DELETE /playlist/:id
 */
export type DeletePlaylistResponse = {};

/*
 * DELETE /playlist/:id/video
 */
export type DeletePlaylistVideoResponse = {};

//
// Listing Responses
// --------------------------------------------------

/*
 * GET /listing/featured/channels
 */
export type GetListingFeaturedChannelsResponse = Array<Channel>;

/*
 * GET /listing/videos/popular
 */
export type GetListingPopularVideosResponse = Cursor<Browsable>;

/*
 * GET /listing/videos/new
 */
export type GetListingNewVideosResponse = Cursor<Browsable>;
