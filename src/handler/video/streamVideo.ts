import { Request, Response } from 'express';
import { Low } from 'lowdb/lib';

import { FileUtils, streamPath, uploadPath, uploadPathChunks } from 'service/video/fileUtils';
import { FilenameUtils } from 'service/video/filenameUtils';
import { chunkSize } from 'service/fileSystem/multer';
import fs from "fs";

export const streamList = async (req: Request, res: Response) => {
    try {
        const videos = fs.readdirSync(streamPath);
        res.send({
            streamList: videos
        });
    } catch (error) {
        console.error(error);
        res.status(400).send({ error, success: false });
    }
};
