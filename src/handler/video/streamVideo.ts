import { Request, Response } from 'express';
import { Low } from 'lowdb/lib';

import { FileUtils, uploadPath, uploadPathChunks } from 'service/video/fileUtils';
import { FilenameUtils } from 'service/video/filenameUtils';
import { chunkSize } from 'service/fileSystem/multer';
import fs from "fs";

export const basicStream = async (req: Request, res: Response) => {
    try {

    } catch (error) {
        console.error(error);
        res.status(400).send({ error, success: false });
    }
};
