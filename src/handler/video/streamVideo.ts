import { Request, Response } from 'express';
import { FileSystemPathType, FileSystemActionType } from 'initFs';

export const streamList = async (req: Request, res: Response) => {
    try {
        const videos = await FileSystemActionType.readFormDir(FileSystemPathType.streamPath, undefined);
        res.send({
            streamList: videos
        });
    } catch (error) {
        console.error(error);
        res.status(400).send({ error, success: false });
    }
};
