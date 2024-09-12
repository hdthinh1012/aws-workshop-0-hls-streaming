import { Request, Response } from 'express';
import { Low } from 'lowdb/lib';

import { FileUtils, uploadPath, uploadPathChunks } from 'service/video/fileUtils';
import { FilenameUtils } from 'service/video/filenameUtils';
import { chunkSize } from 'service/fileSystem/multer';
import { VideoProcessUtils } from 'service/video/videoProcessUtils';
import fs from "fs";


export const processVideo = async (req: Request, res: Response) => {
    try {
        res.send({
            api: '/api/video/process/'
        })
    } catch (error) {
        console.error('processVideo error:', error);
        res.status(400).send({ error, success: false });
    }
};

export const getAllUploadInfo = async (req: Request, res: Response) => {
    try {
        const videoInfos = await VideoProcessUtils.getAllInfos();
        res.send({
            videoInfos: videoInfos,
            date: Date.now()
        })
    } catch (error) {
        console.error('getAllUploadInfo error:', error);
        res.status(400).send({ error, success: false });
    }
};
