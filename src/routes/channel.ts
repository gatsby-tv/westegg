import { Router } from "express";
import { User } from "../entities/User";
import {
  PostChannelRequest,
  ErrorResponse,
  ErrorCode,
  WestEggError
} from "@gatsby-tv/types";
import { isAuthenticated } from "../middleware/auth";
import { Channel } from "../entities/Channel";
import { validatePostChannel } from "../middleware/channel";

const router = Router();

router.post("/", isAuthenticated, validatePostChannel, async (req, res) => {
  try {
    const request: PostChannelRequest = req.body;

    // Get the user making the request
    const user = await User.findById(request.owner);

    if (!user) {
      throw new WestEggError(ErrorCode.NOT_FOUND, "Channel owner not found!");
    }

    // Create the new channel
    const channel = new Channel({
      handle: request.handle,
      name: request.name,
      creationDate: Date.now(),
      owners: [user._id]
    });
    await channel.save();

    // Update the user with the channel FK
    user.channels.push(channel._id);
    user.save();

    // TODO: as PostChannelResponse
    res.status(201).json(channel.toJSON());
  } catch (error) {
    return res.status(400).json({ error } as ErrorResponse);
  }
});

export default router;
