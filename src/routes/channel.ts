// import { Router } from "express";
// import { getMongoRepository, ObjectID } from "typeorm";
// import Channel from "../entities/Channel";
// import User from "../entities/User";
// import { validateCreateChannel } from "../middleware/channel";
// import { isAuthenticated } from "../middleware/auth";
// import { CreateChannelRequest } from "../types";

// const router = Router();

// router.post("/", isAuthenticated, validateCreateChannel, async (req, res) => {
//   try {
//     const request: CreateChannelRequest = req.body;

//     // Add the channel to the user document
//     const userRepo = getMongoRepository(User);
//     const user = await userRepo.findOne({ handle: request.user?.handle });

//     // Create the new channel
//     const channel = new Channel(
//       request.handle,
//       request.displayName,
//       user?._id!
//     );
//     await channel.save();

//     // Save channel FK to the user
//     await userRepo.updateOne(
//       { _id: user?._id },
//       { $push: { channels: channel._id } }
//     );

//     res.sendStatus(201);
//   } catch (error) {
//     return res.status(400).json({ error: error.message });
//   }
// });

// export default router;
