import {
  BadRequest,
  DeleteUserSubscriptionResponse,
  DeleteUserSubscriptionRequest,
  DeleteUserSubscriptionRequestParams,
  ErrorMessage,
  GetChannelAccountRequest,
  GetUserAccountRequest,
  GetUserAccountResponse,
  GetUserHandleExistsRequest,
  GetUserHandleExistsResponse,
  GetUserChannelsRequestParams,
  GetUserListingSubscriptionsRequest,
  NotFound,
  PostAuthCompleteSignUpResponse,
  PostUserCompleteSignupRequest,
  PutUserAvatarRequestParams,
  PutUserAvatarResponse,
  PutUserBannerRequestParams,
  PutUserBannerResponse,
  PutUserRequest,
  PutUserRequestParams,
  PutUserSubscriptionRequest,
  PutUserSubscriptionRequestParams,
  PutUserSubscriptionResponse,
  StatusCode,
  Video
} from "@gatsby-tv/types";
import { Channel } from "@src/entities/Channel";
import { PersistSignInKey } from "@src/entities/PersistSignInKey";
import { SignInKey } from "@src/entities/SignInKey";
import { User } from "@src/entities/User";
import { Video as VideoCollection } from "@src/entities/Video";
import { isValidBody } from "@src/middleware";
import { isAuthenticated, validateSignup } from "@src/middleware/auth";
import { validateCursorRequest } from "@src/middleware/listing";
import { upload } from "@src/middleware/multipart";
import {
  hasPermissionToPutUserRequest,
  validatePutUserRequest
} from "@src/middleware/user";
import { isMongoDuplicateKeyError, projection } from "@src/util";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { keys as keysOf } from "ts-transformer-keys";
import { preAlphaFillListing } from "@src/util/cursor";

const router = Router();

/**
 * GET /user/{:id, :handle}
 */
router.get(
  // :unique can be either :id or :handle
  "/:unique",
  async (req, res, next) => {
    const params = req.params as GetUserAccountRequest;

    let user;
    if (Types.ObjectId.isValid(params.unique)) {
      const id = new Types.ObjectId(params.unique);
      user = await User.findById(
        id,
        projection(keysOf<GetUserAccountResponse>())
      );
    } else {
      // Not a mongo object id, try with handle
      user = await User.findOne(
        { handle: params.unique },
        projection(keysOf<GetUserAccountResponse>())
      );
    }

    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    res.status(StatusCode.OK).json(user.toJSON() as GetUserAccountResponse);
  }
);

/**
 * POST /user
 */
router.post(
  "/",
  validateSignup,
  (req, res, next) => {
    isValidBody(keysOf<PostUserCompleteSignupRequest>(), req, res, next);
  },
  async (req, res, next) => {
    const body = req.body as PostUserCompleteSignupRequest;

    // Check if signinKey exists
    const signinKey =
      (await PersistSignInKey.findOne({ key: body.key })) ||
      (await SignInKey.findOne({ key: body.key }));
    if (!signinKey) {
      throw new NotFound(ErrorMessage.SIGNIN_KEY_NOT_FOUND);
    }

    const user = new User({
      handle: body.handle,
      name: body.name,
      email: signinKey.email,
      creationDate: Date.now()
    });
    try {
      await user.save();
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        if (error.message.includes("index: handle")) {
          throw new BadRequest(ErrorMessage.HANDLE_IN_USE);
        }
        if (error.message.includes("index: email")) {
          throw new BadRequest(ErrorMessage.EMAIL_IN_USE);
        }
      }
      next(error);
    }

    // Sign a jwt with the user
    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET!, {
      expiresIn: "4w"
    });

    // Drop the signin key or persist signin key (if exists)
    signinKey.remove();

    res
      .status(StatusCode.CREATED)
      .json({ token } as PostAuthCompleteSignUpResponse);
  }
);

/**
 * GET /user/:handle/exists
 */
router.get("/:handle/exists", async (req, res, next) => {
  const params = req.params as GetUserHandleExistsRequest;
  const user = await User.findOne(
    { handle: params.handle },
    projection(keysOf<GetUserHandleExistsResponse>())
  );

  if (!user) {
    throw new NotFound(ErrorMessage.USER_NOT_FOUND);
  }

  res.status(StatusCode.OK).json(user.toJSON() as GetUserHandleExistsResponse);
});

/*
 * PUT /user/:id
 */
router.put(
  "/:id",
  isAuthenticated,
  (req, res, next) => {
    isValidBody(keysOf<PutUserRequest>(), req, res, next);
  },
  hasPermissionToPutUserRequest,
  async (req, res, next) => {
    const body = req.body as PutUserRequest;
    const params = req.params as PutUserRequestParams;

    try {
      await User.findByIdAndUpdate(params.id, body);
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        if (error.message.includes("index: handle")) {
          throw new BadRequest(ErrorMessage.HANDLE_IN_USE);
        }
        if (error.message.includes("index: email")) {
          throw new BadRequest(ErrorMessage.EMAIL_IN_USE);
        }
      }
      next(error);
    }

    res.sendStatus(StatusCode.CREATED);
  }
);

/**
 * PUT /user/:id/avatar
 */
router.put(
  "/:id/avatar",
  isAuthenticated,
  hasPermissionToPutUserRequest,
  validatePutUserRequest,
  (req, res, next) => {
    upload(req, res, next, 2);
  },
  async (req, res, next) => {
    const params = req.params as PutUserAvatarRequestParams;

    const user = await User.findById(
      params.id,
      projection(keysOf<PutUserAvatarResponse>())
    );
    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    // Get the file uploaded and add to the user
    user.avatar = req.ipfsContent!;
    user.save();

    res.status(StatusCode.CREATED).json(user.toJSON() as PutUserAvatarResponse);
  }
);

/**
 * PUT /user/:id/banner
 */
router.put(
  "/:id/banner",
  isAuthenticated,
  hasPermissionToPutUserRequest,
  (req, res, next) => {
    upload(req, res, next, 2);
  },
  async (req, res, next) => {
    const params = req.params as PutUserBannerRequestParams;

    const user = await User.findById(
      params.id,
      projection(keysOf<PutUserBannerResponse>())
    );
    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    user.banner = req.ipfsContent!;
    user.save();

    res.status(StatusCode.CREATED).json(user.toJSON() as PutUserBannerResponse);
  }
);

/**
 * PUT /user/:id/subscription
 */
router.put(
  "/:id/subscription",
  isAuthenticated,
  (req, res, next) => {
    isValidBody(keysOf<PutUserSubscriptionRequest>(), req, res, next);
  },
  hasPermissionToPutUserRequest,
  async (req, res, next) => {
    const body = req.body as PutUserSubscriptionRequest;
    const params = req.params as PutUserSubscriptionRequestParams;

    const user = await User.findById(params.id);
    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    if (user.subscriptions.includes(body.subscription)) {
      throw new BadRequest(ErrorMessage.SUBSCRIPTION_ALREADY_EXISTS);
    }

    const channel = await Channel.findById(body.subscription);
    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    user.subscriptions.push(body.subscription);
    user.save();

    channel.subscribers += 1;
    channel.save();

    res
      .status(StatusCode.CREATED)
      .json(user.toJSON() as PutUserSubscriptionResponse);
  }
);

/**
 * GET /user/:id/listing/recommended
 */
router.get(
  "/:id/listing/recommended",
  validateCursorRequest,
  async (req, res, next) => {
    let videos = (await VideoCollection.aggregate()
      .match({
        _id: { $gt: req.cursor }
      })
      .lookup({
        from: Channel.collection.name,
        localField: "channel",
        foreignField: "_id",
        as: "channel"
      })
      .unwind({
        path: "$channel",
        preserveNullAndEmptyArrays: true
      })
      .project(projection(keysOf<Video>()))
      .limit(req.limit)) as Video[];

    const listing = preAlphaFillListing<Video>(videos, req.limit);

    const response = {
      content: listing.content,
      cursor: listing.next,
      limit: req.limit
    };

    res.status(StatusCode.OK).json(response);
  }
);

/**
 * GET /user/:id/listing/subscriptions
 */
router.get(
  "/:id/listing/subscriptions",
  validateCursorRequest,
  async (req, res, next) => {
    const params = req.params as GetUserListingSubscriptionsRequest;
    const user = await User.findById(params.id);
    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    let videos = (await VideoCollection.aggregate()
      .match({ _id: { $gt: req.cursor }, channel: { $in: user.subscriptions } })
      .lookup({
        from: Channel.collection.name,
        localField: "channel",
        foreignField: "_id",
        as: "channel"
      })
      .unwind({
        path: "$channel",
        preserveNullAndEmptyArrays: true
      })
      .project(projection(keysOf<Video>()))
      .limit(req.limit)) as Video[];

    const listing = preAlphaFillListing<Video>(videos, req.limit);

    const response = {
      content: listing.content,
      cursor: listing.next,
      limit: req.limit
    };

    res.status(StatusCode.OK).json(response);
  }
);

/**
 * DELETE /user/:id/subscription
 */
router.delete(
  "/:id/subscription",
  isAuthenticated,
  (req, res, next) => {
    isValidBody(keysOf<DeleteUserSubscriptionRequest>(), req, res, next);
  },
  hasPermissionToPutUserRequest,
  async (req, res, next) => {
    const body = req.body as DeleteUserSubscriptionRequest;
    const params = req.params as DeleteUserSubscriptionRequestParams;

    const user = await User.findById(params.id);
    if (!user) {
      throw new NotFound(ErrorMessage.USER_NOT_FOUND);
    }

    if (!user.subscriptions.includes(body.channel)) {
      throw new BadRequest(ErrorMessage.BAD_REQUEST);
    }

    const channel = await Channel.findById(body.channel);
    if (!channel) {
      throw new NotFound(ErrorMessage.CHANNEL_NOT_FOUND);
    }

    user.subscriptions = user.subscriptions.filter((subscription: string) => {
      return subscription.toString() !== body.channel;
    });
    user.save();

    channel.subscribers -= 1;
    channel.save();

    res
      .status(StatusCode.OK)
      .json(user.toJSON() as DeleteUserSubscriptionResponse);
  }
);

/**
 * GET /user/:id/channels
 */
router.get("/:id/channels", isAuthenticated, async (req, res, next) => {
  const params = req.params as GetUserChannelsRequestParams;

  const user = await User.findById(params.id);
  if (!user) {
    throw new NotFound(ErrorMessage.USER_NOT_FOUND);
  }

  const channels = await Channel.find({
    _id: { $in: user.channels }
  });

  res.status(StatusCode.OK).json(channels);
});

/**
 * GET /user/:id/subscriptions
 */
router.get("/:id/subscriptions", isAuthenticated, async (req, res, next) => {
  const params = req.params as GetUserChannelsRequestParams;

  const user = await User.findById(params.id);
  if (!user) {
    throw new NotFound(ErrorMessage.USER_NOT_FOUND);
  }

  const channels = await Channel.find({
    _id: { $in: user.subscriptions }
  });

  res.status(StatusCode.OK).json(channels);
});

export default router;
