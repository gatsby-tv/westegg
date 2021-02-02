import { StatusCode } from "@gatsby-tv/types";
import Busboy from "busboy";
import { NextFunction, Request, Response } from "express";
import IPFSClient from "ipfs-http-client";

const ipfs = IPFSClient({
  url: process.env.IPFS_URL || "http://localhost:5001"
});

enum SupportedMimeType {
  JPEG = "image/jpeg",
  PNG = "image/png"
}

export const upload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const busboy = new Busboy({ headers: req.headers });

    // TODO: Promisify
    busboy.on(
      "file",
      async (
        fieldname,
        file: NodeJS.ReadableStream,
        filename,
        encoding,
        mimeType
      ) => {
        // TODO: Validate mime type is allowed
        // TODO: use ipfs block stat or ipfs files stat
        // TODO: Validate file contents
        // TODO: Validate file size

        // TODO: Save file to tmp dir
        // file.pipe();

        // TODO: Pin tmp file to ipfs node/cluster
        // await ipfs.pin.add(file.);
      }
    );

    // TODO: Promisify
    busboy.on("finish", () => {
      res.status(StatusCode.CREATED);
    });

    req.pipe(busboy);
  } catch (error) {
    next(error);
  }
};

// TODO:
export const remove = async () => {};
