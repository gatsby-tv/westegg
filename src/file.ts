import { IPFSContent } from "@gatsby-tv/types";
import Busboy from "busboy";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
// Quick hack to import other ipfs http client types while typescript support is still wip
// @ts-ignore
import IPFSClient, { globSource, UnixFSEntry } from "ipfs-http-client";
import path from "path";

const ipfs = IPFSClient({
  url: process.env.IPFS_URL || "http://localhost:5001"
});

enum SupportedMimeType {
  JPEG = "image/jpeg",
  PNG = "image/png"
}

const TMP_DIR = "/tmp";

export const upload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const busboy = new Busboy({ headers: req.headers });
    let tmpFilePath: fs.PathLike;
    let tmpFileMimeType: SupportedMimeType;

    // TODO: Promisify
    busboy.on(
      "file",
      (
        fieldname,
        file: NodeJS.ReadableStream,
        filename,
        encoding,
        mimeType
      ) => {
        // TODO: Validate mime type is allowed
        // TODO: Validate file contents
        // TODO: Validate file size

        // Save file to tmp dir
        tmpFileMimeType = <SupportedMimeType>mimeType;
        tmpFilePath = path.join(TMP_DIR, `${Date.now()}_${filename}`);
        file.pipe(fs.createWriteStream(tmpFilePath));
      }
    );

    // TODO: Promisify
    busboy.on("finish", async () => {
      // Pin tmp file to ipfs node/cluster
      const file: UnixFSEntry = await ipfs.add(globSource(tmpFilePath));
      await ipfs.pin.add(file.cid);
      const ipfsContent: IPFSContent = {
        hash: file.cid.toString(),
        mimeType: tmpFileMimeType
      };
      req.ipfsContent = ipfsContent;
      // TODO: Clean up tmp file

      // Pass ipfs content to endpoint
      next();
    });

    // Transfer http multipart file to busboy over stream
    req.pipe(busboy);
  } catch (error) {
    next(error);
  }
};

// TODO:
export const remove = async () => {};
