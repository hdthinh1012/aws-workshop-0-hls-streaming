import { AbstractFileSystemAction } from "./localFileSystemAction";
import { s3 } from 'service/fileSystem/awsS3Config';
import {
    GetObjectCommand,
    _Object,
} from "@aws-sdk/client-s3";
import { jsonSecret } from "service/fileSystem/awsS3Config";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Writable, Readable } from "node:stream";

export const getObjectRange = ({ bucket, key, start, end }) => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: `bytes=${start}-${end}`,
    });

    return s3.send(command);
};

/**
 * @param {string | undefined} contentRange
 */
export const getRangeAndLength = (contentRange: string) => {
    contentRange = contentRange.slice(6);
    console.log('getRangeAndLength input', contentRange);
    const [range, length] = contentRange.split("/");
    const [start, end] = range.split("-");
    return {
        start: parseInt(start),
        end: parseInt(end),
        length: parseInt(length),
    };
};

export const isComplete = ({ end, length }) => end === length - 1;

export class AWSS3FileReadStream extends Readable {
    filePath: string;
    highWaterMark: number;
    chunks: Uint8Array = new Uint8Array();
    lastRange = { start: -1, end: -1, length: -1 };
    nextRange = { start: -1, end: -1, length: -1 };

    constructor({ highWaterMark, filePath }) {
        super({ highWaterMark });
        this.filePath = filePath;
    }

    _construct(callback: (error?: Error | null) => void): void {
        console.log('AWS read stream _construct called');
        callback();
    }

    chunksConcat(newChunk: Uint8Array): void {
        var mergedArray = new Uint8Array(this.chunks.byteLength + newChunk.byteLength);
        mergedArray.set(this.chunks);
        mergedArray.set(newChunk, this.chunks.byteLength);
        this.chunks = mergedArray;
    }

    _read(size) {
        console.log('[AWSS3FileReadStream._read(size)] want-to-read size: ', size);
        if (isComplete(this.lastRange)) {
            this.push(null);
            return;
        }
        const { end } = this.lastRange;
        this.nextRange = { start: end + 1, end: end + size, length: size };

        getObjectRange({
            bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
            key: this.filePath,
            ...this.nextRange,
        }).then(({ ContentRange, Body }) => {
            const contentRange = getRangeAndLength(ContentRange);

            console.log('[AWSS3FileReadStream._read(size)] actual read size', contentRange);
            this.lastRange = contentRange;
            Body.transformToByteArray()
                .then((chunk) => {
                    this.chunksConcat(chunk);
                    let uploadingChunk = this.chunks;
                    this.chunks = new Uint8Array(0);
                    this.push(uploadingChunk);
                })
                .catch((error) => {
                    console.log('Body.transformToByteArray() error', error);
                });
        });
    }

    _destroy(error, callback) {
        callback();
    }
}