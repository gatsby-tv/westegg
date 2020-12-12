import { Router } from "express";
import { validateCreateChannel } from "../middleware/channel";
import { isAuthenticated } from "../middleware/auth";
import { CreateChannelRequest } from "../requestTypes";
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
    const user = await User.findOne({
      handle: req.decodedUserToken!.handle
    });

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
    if (!req.query.id && !req.query.handle) {
      throw new WestEggError(
        ErrorCode.BAD_REQUEST,
        "No id or handle specified!"
      );
    }

    let channel;
    if (req.query.id) {
      channel = await Channel.findById(req.query.id as string);
    } else {
      channel = await Channel.findOne({ handle: req.query.handle! as string });
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
    let page, perPage;
    if (!req.query.page && !req.query.perPage) {
      throw new WestEggError(
        ErrorCode.BAD_REQUEST,
        "No page or perPage specified!"
      );
    } else {
      page = parseInt(req.query.page! as string);
      perPage = parseInt(req.query.perPage! as string);
    }

    let channels: IChannel[] = [];

    // Client wants channels with specific values
    if (req.query.filterKey && req.query.filterValue) {
      const filter = {
        key: req.query.filterKey as string,
        value: req.query.filterValue as string
      };
      channels = await Channel.where(filter.key, filter.value)
        .skip(page)
        .limit(perPage);
    } else {
      channels = await Channel.find().skip(page).limit(perPage);
    }

    return res.status(200).json({
      channels,
      page: page,
      perPage: perPage
    } as GetChannelListResponse);
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

export default router;
