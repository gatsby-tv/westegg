// import { Router } from "express";
// import Channel from "../entities/Channel";
// import User from "../entities/User";
// import { isAuthenticated } from "../middleware/auth";
// import { CreateChannelRequest } from "../types";

// const router = Router();

// // TODO: Middleware to disallow duplicate channel handles
// router.post("/", isAuthenticated, async (req, res) => {
//   try {
//     const request: CreateChannelRequest = req.body;

//     // Get the user from the db
//     const user = await User.findOne({ handle: request.user!.handle });

//     // Create the new channel
//     const channel = new Channel(request.handle, request.displayName, user!);

//     // Save to the db
//     await channel.save();
//     res.sendStatus(201);
//   } catch (error) {
//     return res.status(400).json({ error: error.message });
//   }
// });

// export default router;
