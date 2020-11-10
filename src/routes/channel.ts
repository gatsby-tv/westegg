import { Router } from "express";
import { validateCreateChannel } from "../middleware/channel";
import { isAuthenticated } from "../middleware/auth";
import {
  CreateChannelRequest,
  GetChannelListRequest,
  GetChannelRequest
} from "../requestTypes";
import { User } from "../entities/User";
import { Channel, IChannel } from "../entities/Channel";
import {
  CreateChannelResponse,
  ErrorResponse,
  GetChannelListResponse,
  GetChannelResponse
} from "../responseTypes";
import { ErrorCode, WestEggError } from "../errors";

const router = Router();

router.post("/", isAuthenticated, validateCreateChannel, async (req, res) => {
  try {
    const request: CreateChannelRequest = req.body;

    // Get the user making the request
    const user = await User.findOne({ handle: request.user?.handle });

    // Create the new channel
    const channel = await Channel.create({
      handle: request.handle,
      displayName: request.displayName,
      owner: user?._id
    });
    await channel.save();

    // Update the user with the channel FK
    user?.channels.push(channel._id);
    user?.save();

    res.status(201).json(channel.toJSON() as CreateChannelResponse);
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

router.get("/", async (req, res) => {
  try {
    const request: GetChannelRequest = req.body;

    let channel;
    if (request.id) {
      channel = await Channel.findById(request.id);
    } else {
      channel = await Channel.findOne({ handle: request.handle });
    }

    // If we don't find the channel
    if (!channel) {
      return res.status(404).json({
        error: new WestEggError(ErrorCode.NOT_FOUND, "Channel not found!")
      } as ErrorResponse);
    }

    // Channel found
    return res.status(200).json(channel.toJSON() as GetChannelResponse);
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

router.get("/list", async (req, res) => {
  try {
    const request: GetChannelListRequest = req.body;

    let channels: IChannel[] = [];

    // Client wants channels with specific values
    if (request.filter) {
      const filter = request.filter;
      channels = await Channel.where(filter.key, filter.value)
        .skip(request.page)
        .limit(request.perPage);
    } else {
      channels = await Channel.find().skip(request.page).limit(request.perPage);
    }

    return res.status(200).json({
      channels,
      page: request.page,
      perPage: request.perPage
    } as GetChannelListResponse);
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

export default router;
