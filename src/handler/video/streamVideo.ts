import { Request, Response } from 'express';
import { streamPath } from 'service/fileSystem/localFileSystemPath';
import { LocalFileSystemAction } from 'service/fileSystem/localFileSystemAction';

export const streamList = async (req: Request, res: Response) => {
    try {
        const videos = LocalFileSystemAction.readFormDir(streamPath, undefined);
        res.send({
            streamList: videos
        });
    } catch (error) {
        console.error(error);
        res.status(400).send({ error, success: false });
    }
};
