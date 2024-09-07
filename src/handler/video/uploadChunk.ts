import multer from 'multer';
import fs from 'fs';
import e, { Request, Response } from 'express';
import { Low } from 'lowdb/lib';
import path from 'path';

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

                /**
                 * Check is last chunk
                 */
                const uploadChunksState = db.data[fileName];
                const isFinish = (uploadChunksState.length > 0) && (uploadChunksState.filter((chunkState: boolean) => chunkState == false).length == 0);
                if (isFinish) {
                    await FileUtils.mergeChunks(db, fileName, undefined);
                }

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

export const splitChunks = async (req: Request, res: Response) => {
    try {
        const { name, user, chunkSum, fileName } = req.body;
        const dbModule = await import('service/database/lowdb');
        const db: Low<{}> = await dbModule.default;
        const baseFileName = fileName.replace(/\s+/g, '');
        if (baseFileName in db.data) {
            await FileUtils.splitIntoChunks(fileName, chunkSum);
            res.send({
                fileName: fileName,
                success: true,
            });
        } else {
            throw 'splitChunks error: file not existed in server';
        }
    }
    catch (error) {
        console.error('splitChunks error:', error);
        res.status(400).send({ error, success: false });
    }
}

export const mergeChunks = async (req: Request, res: Response) => {
    try {
        const { name, user, chunkSum, fileName } = req.body;
        const dbModule = await import('service/database/lowdb');
        const db: Low<{}> = await dbModule.default;
        const baseFileName = fileName.replace(/\s+/g, '');
        if (baseFileName in db.data) {
            await FileUtils.mergeChunks(db, baseFileName, chunkSum);
            res.send({
                fileName: fileName,
                success: true,
            });
        } else {
            throw 'mergeChunks error: file not existed in server';
        }
    }
    catch (error) {
        console.error('mergeChunks error:', error);
        res.status(400).send({ error, success: false });
    }
}

class FileUtils {
    public static async mergeChunks(db: Low<{}>, fileName: string, chunkSum: number | undefined): Promise<void> {
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 1000; // 1 second
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        /**
         * Open file stream, adding chunks into file by command:
         * chunkStream.pipe(writeStream, {end: false})
         */

        const finalFilePath = `${uploadPath}/${fileName}`;
        const writeStream = fs.createWriteStream(finalFilePath);

        const uploadChunksState = db.data[fileName];
        console.log('chunkSum', chunkSum);
        console.log('uploadChunksState.length', uploadChunksState.length);
        const totalPart = chunkSum ?? uploadChunksState.length;
        for (let i = 0; i < totalPart; i++) {
            const chunkName = `${fileName}.part_${i}`;
            console.log('chunkName', chunkName);
            let retries = 0;
            while (retries < MAX_RETRIES) {
                console.log('inside retry');
                try {
                    const chunkPath = `${uploadPathChunks}/${chunkName}`;
                    const readStream = fs.createReadStream(chunkPath);
                    await new Promise<void>((resolve, reject) => {
                        readStream.pipe(writeStream, { end: false });
                        readStream.on('data', (chunk: Buffer) => {
                            console.log('Reading chunk offset, length:', chunk.byteLength, chunk.byteLength);
                        })
                        readStream.on('end', () => {
                            // Delete the chunk file after it has been appended to the final file
                            console.log('Write chunk end');
                            fs.unlinkSync(chunkPath);
                            resolve();
                        });
                        readStream.on('error', (err) => {
                            console.error(`Error reading chunk ${chunkName}:`, err);
                            reject(err);
                        })
                    });
                    console.log('break');
                    break;
                } catch (error) {
                    console.error(`Failed at ${retries} effort for ${chunkName}. Retrying...`);
                    retries += 1;
                    if (retries < MAX_RETRIES) {
                        await delay(RETRY_DELAY);
                    } else {
                        console.error(`Failed to process chunk ${chunkName} after ${retries} retries.`);
                    }
                }
            }
        }
    }

    public static async splitIntoChunks(fileName: string, chunksSum: number) {
        try {
            const finalFilePath = `${uploadPath}/${fileName}`;
            const finalFileStat = fs.statSync(finalFilePath);
            const chunkSize = Math.ceil(finalFileStat.size / chunksSum);
            const readStream = fs.createReadStream(finalFilePath, { highWaterMark: chunkSize });

            let chunkIndex = 0;

            readStream.on('data', (chunk: Buffer) => {
                console.log('Reading chunk offset, length:', chunk.byteLength, chunk.byteLength);
                const chunkFileName = `${fileName}.part_${chunkIndex}`;
                const chunkFilePath = path.join(uploadPathChunks, chunkFileName);
                const writeStream = fs.createWriteStream(chunkFilePath);

                writeStream.write(chunk, () => {
                    writeStream.end();
                })

                chunkIndex++;
            })

            readStream.on('end', () => {
                console.log('File has been split into chunks.');
                fs.unlinkSync(finalFilePath);
            });

            readStream.on('error', (error) => {
                console.error('Error reading the file:', error);
            });

        } catch (error) {
            console.error('Error in splitIntoChunks:', error);
        }
    }
}

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
            if (match && match[1]) {
                return parseInt(match[1], 10);
            }
        } catch (error) {
            console.error('FilenameUtils::getPartNumber error:', error);
            throw error;
        }
    }
}