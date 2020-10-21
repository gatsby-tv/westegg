import { Router } from "express";
import { getMongoRepository, ObjectID } from "typeorm";
import Channel from "../entities/Channel";
import User from "../entities/User";
import { validateCreateChannel } from "../middleware/channel";
import { isAuthenticated } from "../middleware/auth";
import { CreateChannelRequest } from "../types";

const router = Router();

router.post("/", isAuthenticated, validateCreateChannel, async (req, res) => {
  try {
    const request: CreateChannelRequest = req.body;

    // Create the new channel
    const channel = new Channel(request.handle, request.displayName);

    // Add the channel to the user document
    const repo = getMongoRepository(User);
    let user = await repo.findOne({ handle: request.user?.handle });
    await repo.updateOne({ _id: user?._id }, { $push: { channels: channel } });
    res.sendStatus(201);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
