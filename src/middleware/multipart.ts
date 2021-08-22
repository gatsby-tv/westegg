import { BadRequest, ErrorMessage, IPFSContent } from "@gatsby-tv/types";
import Busboy from "busboy";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import { create, globSource } from "ipfs-http-client";
import path from "path";

const ipfs = create({
  url: process.env.IPFS_URL || "http://localhost:5001"
});

enum SupportedMimeType {
  JPEG = "image/jpeg",
  PNG = "image/png"
}

const TMP_DIR = "/tmp";
const MiB_SIZE = 1048576;

export const upload = async (
  req: Request,
  res: Response,
  next: NextFunction,
  contentLength: number
) => {
  const busboy = new Busboy({ headers: req.headers });
  let tmpFilePath: fs.PathLike;
  let tmpFileMimeType: SupportedMimeType;

  busboy.on(
    "file",
    (fieldname, file: NodeJS.ReadableStream, filename, encoding, mimeType) => {
      let mimeTypes = Object.values(SupportedMimeType) as string[];
      if (!mimeTypes.includes(mimeType)) {
        throw new BadRequest(ErrorMessage.INVALID_FILE_TYPE);
      }

      if (parseInt(req.headers["content-length"]!) > contentLength * MiB_SIZE) {
        throw new BadRequest(ErrorMessage.INVALID_FILE_SIZE);
      }

      // Save file to tmp dir
      tmpFileMimeType = <SupportedMimeType>mimeType;
      tmpFilePath = path.join(TMP_DIR, `${Date.now()}_${filename}`);
      file.pipe(fs.createWriteStream(tmpFilePath));
    }
  );

  busboy.on("finish", async () => {
    // Pin tmp file to ipfs node/cluster
    const file = await ipfs.add(globSource(tmpFilePath.toString()) as any);
    await ipfs.pin.add(file.cid);
    const ipfsContent: IPFSContent = {
      hash: file.cid.toString(),
      mimeType: tmpFileMimeType
    };
    req.ipfsContent = ipfsContent;

    await fs.promises.rm(tmpFilePath);

    // Pass ipfs content to endpoint
    next();
  });

  // Transfer http multipart file to busboy over stream
  req.pipe(busboy);
};

// TODO:
export const remove = async () => {};
