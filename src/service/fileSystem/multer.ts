import multer from 'multer';
import fs from 'fs';
import { Low } from 'lowdb/lib';

import { uploadPathChunks, FilenameUtils } from 'service/video/fileUtils';

export const chunkSize = 4 * 1024 * 1024; // 4MiB chunk size

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