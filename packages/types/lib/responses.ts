import { WestEggError } from "@lib/errors";
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

//
// Generic Responses
// --------------------------------------------------
export type ErrorResponse = {
  error: WestEggError;
};

export type Response<T = {}> = T | ErrorResponse;

export type Cursor<T = {}> = {
  content: T;
  cursor: ObjectID | undefined;
  limit: number;
};

export type CursorResponse<T = {}> = Cursor<T> | ErrorResponse;

//
// Authentication Responses
// --------------------------------------------------

/*
 * POST /auth/signin
 *
 * This will come back as 200 OK no matter what (barring no internal errors), as to not indicate if the email the magic link was sent to exists or not.
 */
export type PostAuthSignInResponse = Response;

/*
 * GET /auth/signin/:key
 */
export type GetAuthSignInKeyResponse = Response<{ token: EncodedToken }>;

/*
 * POST /auth/signin/:key/persist
 *
 * This response will always give a 200 OK even if the signin key doesn't exist as to not let the client know if a signin key exists or not.
 */
export type PostAuthPersistSignInKeyResponse = Response;

/*
 * GET /auth/token/refresh
 */
export type GetAuthTokenRefreshResponse = Response<{ token: EncodedToken }>;

/*
 * POST /auth/token/invalidate
 */
export type PostAuthInvalidateAllPreviousTokensResponse = Response;

//
// User Responses
// --------------------------------------------------

/*
 * POST /user
 */
export type PostAuthCompleteSignUpResponse = Response<{ token: EncodedToken }>;

/*
 * GET /user/{:id,:handle}
 */
export type GetUserAccountResponse = Response<User>;

/*
 * GET /user/:handle/exists
 */
export type GetUserHandleExistsResponse = Response<User>;

/*
 * GET /user/:id/public
 */
export type GetUserPublicResponse = Response<UserPublicInfo>;

/*
 * GET /user/:id/private
 */
export type GetUserPrivateResponse = Response<UserPrivateInfo>;

/*
 * GET /user/:id/feeds
 */
export type GetUserFeedsResponse = Response<UserContentFeeds>;

/*
 * GET /user/:id/history
 */
export type GetUserHistoryResponse = Response<UserHistory>;

/*
 * GET /user/:id/promotions
 */
export type GetUserPromotionsResponse = Response<UserPromotions>;

/*
 * GET /user/:id/listing/recommended
 */
export type GetUserListingRecommendedResponse = CursorResponse<
  Array<Browsable>
>;

/*
 * GET /user/:id/listing/subscriptions
 */
export type GetUserListingSubscriptionsResponse = CursorResponse<
  Array<BrowsableVideo>
>;

/*
 * PUT /user/:id
 */
export type PutUserResponse = Response;

/*
 * PUT /user/:id/avatar
 */
export type PutUserAvatarResponse = Response<User>;

/*
 * PUT /user/:id/banner
 */
export type PutUserBannerResponse = Response<User>;

/*
 * PUT /user/:id/subscription
 */
export type PutUserSubscriptionResponse = Response<User>;

/*
 * PUT /user/:id/follow
 */
export type PutUserFollowResponse = Response;

/*
 * PUT /user/:id/history
 */
export type PutUserHistoryResponse = Response;

/*
 * PUT /user/:id/promotion
 */
export type PutUserPromotionResponse = Response;

/*
 * PUT /user/:id/settings
 */
export type PutUserSettingsResponse = Response;

/*
 * PUT /user/:id/owner/accept
 */
export type PutUserOwnerAcceptResponse = Response;

/*
 * PUT /user/:id/collaboration/accept
 */
export type PutUserCollaborationAcceptResponse = Response;

/*
 * PUT /user/:id/admin/accept
 */
export type PutUserAdminAcceptResponse = Response;

/*
 * PUT /user/:id/moderator/accept
 */
export type PutUserModeratorAcceptResponse = Response;

/*
 * DELETE /user/:id
 */
export type DeleteUserResponse = Response;

/*
 * DELETE /user/:id/subscription
 */
export type DeleteUserSubscriptionResponse = Response;

/*
 * DELETE /user/:id/follow
 */
export type DeleteUserFollowResponse = Response;

/*
 * DELETE /user/:id/history
 */
export type DeleteUserHistoryResponse = Response;

/*
 * DELETE /user/:id/history/all
 */
export type DeleteUserEntireHistoryResponse = Response;

/*
 * DELETE /user/:id/promotion
 */
export type DeleteUserPromotionResponse = Response;

/*
 * DELETE /user/:id/collaboration
 */
export type DeleteUserCollaborationResponse = Response;

/*
 * DELETE /user/:id/admin
 */
export type DeleteUserAdminResponse = Response;

/*
 * DELETE /user/:id/moderator
 */
export type DeleteUserModeratorResponse = Response;

/*
 * DELETE /user/:id/owner/invite
 */
export type DeleteUserOwnerInviteResponse = Response;

/*
 * DELETE /user/:id/collaboration/invite
 */
export type DeleteUserCollaborationInviteResponse = Response;

/*
 * DELETE /user/:id/admin/invite
 */
export type DeleteUserAdminInviteResponse = Response;

/*
 * DELETE /user/:id/moderator/invite
 */
export type PutUserModeratorInviteResponse = Response;

//
// Channel Responses
// --------------------------------------------------

/*
 * POST /channel
 */
export type PostChannelResponse = Response<Channel>;

/*
 * GET /channel/{:id,:handle}
 */
export type GetChannelAccountResponse = Response<Channel>;

/*
 * GET /channel/:handle/exists
 */
export type GetChannelHandleExistsResponse = Response<Channel>;

/*
 * GET /channel/:id/public
 */
export type GetChannelPublicResponse = Response<ChannelPublicInfo>;

/*
 * GET /channel/:id/private
 */
export type GetChannelPrivateResponse = Response<ChannelPrivateInfo>;

/*
 * GET /channel/:id/content
 */
export type GetChannelContentResponse = Response<ChannelContent>;

/*
 * GET /channel/:id/videos
 */
export type GetChannelVideosResponse = CursorResponse<Array<Video>>;

/*
 * GET /channel/:id/playlists
 */
export type GetChannelPlaylistsResponse = CursorResponse<Array<Playlist>>;

/*
 * GET /channel/:id/shows
 */
export type GetChannelShowsResponse = CursorResponse<Array<Show>>;

/*
 * PUT /channel/:id
 */
export type PutChannelResponse = Response;

/*
 * PUT /channel/:id/handle
 */
export type PutChannelHandleResponse = Response;

/*
 * PUT /channel/:id/avatar
 */
export type PutChannelAvatarResponse = Response<Channel>;

/*
 * PUT /channel/:id/banner
 */
export type PutChannelBannerResponse = Response<Channel>;

/*
 * PUT /channel/:id/poster
 */
export type PutChannelPosterResponse = Response<Channel>;

/*
 * PUT /channel/:id/owner/invite
 */
export type PutChannelOwnerInviteResponse = Response;

/*
 * PUT /channel/:id/collaborator/invite
 */
export type PutChannelCollaboratorInviteResponse = Response;

/*
 * PUT /channel/:id/contributor/invite
 */
export type PutChannelContributorInviteResponse = Response;

/*
 * PUT /channel/:id/contributor/roles
 */
export type PutChannelContributorRolesResponse = Response;

/*
 * PUT /channel/:id/admin/invite
 */
export type PutChannelAdminInviteResponse = Response;

/*
 * PUT /channel/:id/admin/settings
 */
export type PutChannelAdminSettingsResponse = Response;

/*
 * PUT /channel/:id/moderator/invite
 */
export type PutChannelModeratorInviteResponse = Response;

/*
 * PUT /channel/:id/moderator/settings
 */
export type PutChannelModeratorSettingsResponse = Response;

/*
 * DELETE /channel/:id
 */
export type DeleteChannelResponse = Response;

/*
 * DELETE /channel/:id/owner
 */
export type DeleteChannelOwnerResponse = Response;

/*
 * DELETE /channel/:id/collaborator
 */
export type DeleteChannelCollaboratorResponse = Response;

/*
 * DELETE /channel/:id/contributor
 */
export type DeleteChannelContributorResponse = Response;

/*
 * DELETE /channel/:id/admin
 */
export type DeleteChannelAdminResponse = Response;

/*
 * DELETE /channel/:id/moderator
 */
export type DeleteChannelModeratorResponse = Response;

/*
 * DELETE /channel/:id/owner/invite
 */
export type DeleteChannelOwnerInviteResponse = Response;

/*
 * DELETE /channel/:id/collaborator/invite
 */
export type DeleteChannelCollaboratorInviteResponse = Response;

/*
 * DELETE /channel/:id/contributor/invite
 */
export type DeleteChannelContributorInviteResponse = Response;

/*
 * DELETE /channel/:id/admin/invite
 */
export type DeleteChannelAdminInviteResponse = Response;

/*
 * DELETE /channel/:id/moderator/invite
 */
export type DeleteChannelModeratorInviteResponse = Response;

//
// Video Responses
// --------------------------------------------------

/*
 * POST /video
 */
export type PostVideoResponse = Response<Video>;

/*
 * GET /video/:id
 */
export type GetVideoResponse = Response<Video>;

/*
 * GET /video/:id/listing/related
 */
export type GetVideoListingRelatedResponse = CursorResponse<Array<Browsable>>;

/*
 * PUT /video/:id
 */
export type PutVideoResponse = Response<Video>;

/*
 * PUT /video/:id/view
 */
export type PutVideoViewResponse = Response;

/*
 * PUT /video/:id/content
 */
export type PutVideoContentResponse = Response;

/*
 * PUT /video/:id/report
 */
export type PutVideoReportResponse = Response;

/*
 * DELETE /video/:id
 */
export type DeleteVideoResponse = Response;

//
// Show Responses
// --------------------------------------------------

/*
 * POST /show
 */
export type PostShowResponse = Response;

/*
 * POST /show/:id/episode
 */
export type PostShowEpisodeResponse = Response;

/*
 * GET /show/:id
 */
export type GetShowResponse = Response<Show>;

/*
 * PUT /show/:id
 */
export type PutShowResponse = Response;

/*
 * PUT /show/:id/episode
 */
export type PutShowEpisodeResponse = Response;

/*
 * PUT /show/:id/content
 */
export type PutShowContentResponse = Response;

/*
 * DELETE /show/:id
 */
export type DeleteShowResponse = Response;

//
// Playlist Responses
// --------------------------------------------------

/*
 * POST /playlist
 */
export type PostPlaylistResponse = Response;

/*
 * GET /playlist/:id
 */
export type GetPlaylistResponse = Response<Playlist>;

/*
 * PUT /playlist/:id
 */
export type PutPlaylistResponse = Response;

/*
 * DELETE /playlist/:id
 */
export type DeletePlaylistResponse = Response;

/*
 * DELETE /playlist/:id/video
 */
export type DeletePlaylistVideoResponse = Response;

//
// Listing Responses
// --------------------------------------------------

/*
 * GET /listing/featured/channels
 */
export type GetListingFeaturedChannelsResponse = Response<Array<Channel>>;

/*
 * GET /listing/videos/popular
 */
export type GetListingPopularVideosResponse = CursorResponse<Array<Browsable>>;

/*
 * GET /listing/videos/new
 */
export type GetListingNewVideosResponse = CursorResponse<Array<Browsable>>;
