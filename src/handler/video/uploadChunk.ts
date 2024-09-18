import { Request, Response } from 'express';
import { Low } from 'lowdb/lib';

import { UploadUtils } from 'service/video/uploadUtils';
import { FilenameUtils } from 'service/video/filenameUtils';
import { VideoProcessUtils } from 'service/video/videoProcessUtils';
import { fileSystemActionObject, fileSystemPathObject } from 'initFs';
import { chunkSize } from 'service/multer/multer';

import dotenv from 'dotenv';
dotenv.config();

export const uploadSetup = async (req: Request, res: Response) => {
    try {
        const { baseFileName, fileSize } = req.body;
        const chunkSum = Math.ceil(fileSize / chunkSize);

        const dbModule = await import('service/database/lowdb');
        const db: Low<{}> = await dbModule.default;
        if (baseFileName in db.data) {
            throw 'Filename exist!';
        } else {
            await db.update((data) => data[baseFileName] = new Array(chunkSum).fill(false));
            res.send({
                success: true,
                chunkSum: chunkSum,
                chunkSize: chunkSize
            });
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
                /**
                 * Check is last chunk
                 */
                await db.update((data) => data[fileName][partNo] = true);
                const uploadChunksState = db.data[fileName];
                const isFinish = (uploadChunksState.length > 0) && (uploadChunksState.filter((chunkState: boolean) => chunkState == false).length == 0);
                if (isFinish) {
                    /**
                     * True code
                     */
                    await UploadUtils.mergeChunks(db, fileName, undefined);
                    VideoProcessUtils.generateMasterPlaylist(fileName);
                    /**
                     * Mock test response failed on last part to test cancelling upload
                     */
                    // throw 'Upload part error';
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

export const uploadCancelling = async (req: Request, res: Response) => {
    try {
        const { baseFileName } = req.body;
        const dbModule = await import('service/database/lowdb');
        const db: Low<{}> = await dbModule.default;
        await db.update((data) => delete data[baseFileName]);
        UploadUtils.cleanChunks(baseFileName);
        res.send({
            success: true,
            baseFileName: baseFileName
        });
    } catch (error) {
        res.status(400).send({
            success: false
        })
    }
}

export const splitChunks = async (req: Request, res: Response) => {
    try {
        const { name, user, chunkSum, fileName } = req.body;
        const dbModule = await import('service/database/lowdb');
        const db: Low<{}> = await dbModule.default;
        const baseFileName = fileName.replace(/\s+/g, '');
        if (baseFileName in db.data) {
            await UploadUtils.splitIntoChunks(fileName, chunkSum);
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
            await UploadUtils.mergeChunks(db, baseFileName, chunkSum);
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

export const cleanAll = async (req: Request, res: Response) => {
    try {
        const dbModule = await import('service/database/lowdb');
        const db: Low<{}> = await dbModule.default;
        await db.update((data: {}) => {
            for (const key in data) {
                delete data[key];
            }
        });
        fileSystemActionObject.rmDirectory(fileSystemPathObject.uploadChunkDirectoryPath(), { recursive: true });
        fileSystemActionObject.rmDirectory(fileSystemPathObject.uploadVideoDirectoryPath(), { recursive: true });
        fileSystemActionObject.rmDirectory(fileSystemPathObject.streamDirectoryPath(), { recursive: true });
        res.send({
            success: true
        });
    }
    catch (error) {
        console.error('cleanAll error:', error);
        res.status(400).send({ error, success: false });
    }
}