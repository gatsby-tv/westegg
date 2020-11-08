import { Router } from "express";
import { validateCreateChannel } from "../middleware/channel";
import { isAuthenticated } from "../middleware/auth";
import { CreateChannelRequest } from "../requestTypes";
import { User } from "../entities/User";
import { Channel } from "../entities/Channel";

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

    res.sendStatus(201);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
