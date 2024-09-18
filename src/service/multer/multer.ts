import multer from 'multer';
import fs from 'fs';
import { Low } from 'lowdb/lib';
import dotenv from 'dotenv';
dotenv.config();
import { FileSystemPathType, FileSystemActionType } from 'initFs';
import { FilenameUtils } from 'service/video/filenameUtils';
import { AWSS3CustomStorageEngine } from './awsS3CustomEngine';

export const chunkSize = 8 * 1024 * 1024; // 8MiB chunk size

/**
 * Middleware
 */
const storage = (process.env.IS_AWS_S3 !== '1') ? multer.diskStorage({
    destination: function (req, file, cb: Function) {
        FileSystemActionType.createDir(FileSystemPathType.uploadPathChunks, { recursive: true }); // TODO: Convert to S3
        cb(null, FileSystemPathType.uploadPathChunks);
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
}) : new AWSS3CustomStorageEngine({});

export const upload = multer({
    limits: { fileSize: 3 * 1024 * 1024 * 1024 }, // 2GiB limit
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video') || file.mimetype === 'application/octet-stream') {
            cb(null, true);
        } else {
            cb(new Error('Not a video file. Please upload only videos.'));
        }
    }
});