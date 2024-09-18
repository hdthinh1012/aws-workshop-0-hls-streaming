import { Request, Response } from 'express';
import { fileSystemPathObject, fileSystemActionObject } from 'initFs';

export const streamList = async (req: Request, res: Response) => {
    try {
        const videos = await fileSystemActionObject.readFormDir(fileSystemPathObject.streamDirectoryAbsolutePath(), undefined);
        console.log('fileSystemPathObject.streamDirectoryAbsolutePath()', fileSystemPathObject.streamDirectoryAbsolutePath());
        res.send({
            streamList: videos
        });
    } catch (error) {
        console.error(error);
        res.status(400).send({ error, success: false });
    }
};
