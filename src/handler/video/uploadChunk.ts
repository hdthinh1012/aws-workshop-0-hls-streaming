import multer from 'multer';
import fs from 'fs';
import e, { Request, Response } from 'express';
import { Low } from 'lowdb/lib';

/**
 * Global map to manage different files upload chunks
 * <name> : <array of boolean>
 */
const uploadingChunksDatabase: {
    [key: string]: boolean[]
} = {};

const uploadPath = './uploads/videos';
const uploadPathChunks = './uploads/tmp/fcj-workshop-0';

/**
 * Middleware
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb: Function) {
        fs.mkdirSync(uploadPathChunks, { recursive: true })
        cb(null, uploadPathChunks);
    },
    filename: function (req, file, cb: Function) {
        /**
         * baseFileName must be: 'ex-machima.part_1'
         */
        const baseFileName = file.originalname.replace(/\s+/g, '');
        const fileName: string = FilenameUtils.getBaseName(baseFileName);
        const partNo: number = FilenameUtils.getPartNumber(baseFileName);
        import('service/database/lowdb')
            .then((dbModule) => {
                dbModule.default.then((db: Low<{}>) => {
                    if (!db.data[fileName]) {
                        cb(new Error(`Server not recognize chunk\'s video filename ${fileName}`));
                    } else if (typeof partNo !== 'number') {
                        cb(new Error('File chunk must contain part number, must be <movie-name>.part_<no>!'));
                    } else if (partNo >= db.data[fileName].length) {
                        cb(new Error(`PartNo out of range for filename ${fileName}`));
                    } else {
                        cb(null, baseFileName);
                    }
                })
            })
            .catch((error) => {
                console.error('multer.filename error:', error);
            });
    }
});

export const upload = multer({
    limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GiB limit
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video') || file.mimetype === 'application/octet-stream') {
            cb(null, true);
        } else {
            cb(new Error('Not a video file. Please upload only videos.'));
        }
    }
});

const chunkSize = 8 * 1024 * 1024; // 8MiB chunk size

export const uploadState = async (req: Request, res: Response) => {
    try {
        const dbModule = await import('service/database/lowdb');
        const db: Low<{}> = await dbModule.default;
        res.send({
            db: db.data
        })
    } catch (error) {
        console.error(error);
        res.status(400).send({ error, success: false });
    }
};

export const uploadSetup = async (req: Request, res: Response) => {
    try {
        const { baseFileName, user, chunkSum } = req.body;

        const dbModule = await import('service/database/lowdb');
        const db: Low<{}> = await dbModule.default;
        if (baseFileName in db.data) {
            throw 'Filename exist!';
        } else {
            await db.update((data) => data[baseFileName] = new Array(chunkSum).fill(false));
            res.send({ success: true });
        }
    } catch (error) {
        console.error(error);
        res.status(400).send({ error, success: false });
    }
}

/**
 * This is run right after Multer process upcoming chunk and store into tmp directory
 * @param req 
 * @param res 
 */
export const uploadChunk = async (req, res) => {
    try {
        const { name, user, chunkSum, chunkNo } = req.body;
        if (req.file) {
            const dbModule = await import('service/database/lowdb');
            const db: Low<{}> = await dbModule.default;
            /**
             * Multer check and saved chunk successfully
             */
            const baseFileName = req.file.originalname.replace(/\s+/g, '');
            /**
             * Filename: ex-machima.part_1
             * 
             * -> filename: ex-machima
             * -> part: 1
             */
            const fileName: string = FilenameUtils.getBaseName(baseFileName);
            const partNo: number = FilenameUtils.getPartNumber(baseFileName);
            if (!db.data[fileName]) {
                throw `Server not recognize chunk\'s video filename ${fileName}`;
            } else if (typeof partNo !== 'number') {
                throw 'File chunk must contain part number, must be <movie-name>.part_<no>!';
            } else if (partNo >= db.data[fileName].length) {
                throw `PartNo out of range for filename ${fileName}`;
            } else {
                await db.update((data) => data[fileName][partNo] = true);
                res.send({
                    partNo: partNo,
                    fileName: fileName,
                    success: true,
                })
            }
        } else {
            throw 'Multer did not accept chunk!';
        }
    } catch (error) {
        console.error('uploadChunk error:', error);
        res.status(400).send({ error, success: false });
    }
}
d
class FilenameUtils {
    public static getBaseName(baseFileName: string): string {
        try {
            const lastDotIdx = baseFileName.lastIndexOf('.');
            if (lastDotIdx === -1) {
                throw 'Invalid baseFileName, must be <movie-name>.part_<no>!';
            } else {
                return baseFileName.substring(0, lastDotIdx);
            }
        } catch (error) {
            console.error('FilenameUtils::getBaseName error:', error);
            throw error;
        }
    }

    public static getPartNumber(baseFileName: string): number {
        try {
            const match = baseFileName.match(/\.part_(\d+)$/);
            /**
             * match[0]: full result
             * match[1]: in the (...)
             */
            console.log('match:', match);
            if (match && match[1]) {
                return parseInt(match[1], 10);
            }
        } catch (error) {
            console.error('FilenameUtils::getPartNumber error:', error);
            throw error;
        }
    }
}