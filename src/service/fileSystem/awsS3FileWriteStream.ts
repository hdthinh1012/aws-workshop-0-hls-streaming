import { s3 } from 'service/fileSystem/awsS3Config';
import {
    _Object,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { jsonSecret } from "service/fileSystem/awsS3Config";
import { Writable } from "node:stream";

export class AWSS3FileWriteStream extends Writable {
    highWaterMark: number;
    filePath: string;
    chunks: Uint8Array = new Uint8Array();
    writesCount: number = 0;
    uploadResultsPromise: Promise<any>[] = [];
    uploadId: string; // AWS S3 Object Multipart Id, retain it in the whole process
    constructor({ highWaterMark, filePath }) {
        super({ highWaterMark });
        this.highWaterMark = highWaterMark;
        this.filePath = filePath;
    }

    /**
     * 
     * @param callback This optional function will be called in a tick after the stream constructor has returned, 
     * delaying any _write(), _final() and _destroy() calls until callback is called. 
     * This is useful to initialize state or asynchronously initialize resources before the stream can be used.
     */
    _construct(callback: (error?: Error | null) => void): void {
        s3.send(
            new CreateMultipartUploadCommand({
                Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                Key: this.filePath,
            }),
        ).then((multipartUpload) => {
            this.uploadId = multipartUpload.UploadId;
            callback();
        }).catch((err) => {
            callback(err);
        });
    }

    chunksConcat(newChunk: Uint8Array): void {
        var mergedArray = new Uint8Array(this.chunks.byteLength + newChunk.byteLength);
        mergedArray.set(this.chunks);
        mergedArray.set(newChunk, this.chunks.byteLength);
        this.chunks = mergedArray;
    }

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        // chunk = Uint8Array.from(chunk);
        this.chunksConcat(chunk);
        if (this.chunks.byteLength >= this.highWaterMark) {
            console.log("[AWSS3FileWriteStream._write] write stream buffer's highWaterMark ", this.highWaterMark, " exceeded");
            this.writesCount += 1;
            let partNumber = this.writesCount;
            let uploadingChunk = this.chunks;
            this.chunks = new Uint8Array(0);
            console.log('[AWSS3FileWriteStream._write] prepare-to-write part ', partNumber, ' chunk length:', uploadingChunk.byteLength);
            this.uploadResultsPromise.push(
                s3.send(new UploadPartCommand({
                    Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                    Key: this.filePath,
                    UploadId: this.uploadId,
                    Body: uploadingChunk,
                    PartNumber: partNumber
                })).then((uploadResult) => {
                    console.log(`[AWSS3FileWriteStream._write] file ${this.filePath} write part number`, partNumber, "uploaded");
                    return uploadResult;
                }).catch((err) => {
                    console.log('WriteStream UploadPartCommand error', err);
                    callback(err);
                })
            );
            callback();
        } else {
            // when we are done, we should call the callback function
            callback();
        }
    }

    // this will run after the our stream has finished
    _final(callback) {
        if (this.chunks.byteLength > 0) {
            this.writesCount += 1;
            let partNumber = this.writesCount;
            let uploadingChunk = this.chunks;
            this.chunks = new Uint8Array(0);
            console.log(`[AWSS3FileWriteStream._final] AWSWriteStream uploading last part ${partNumber}, ${uploadingChunk.byteLength} bytes`);
            this.uploadResultsPromise.push(
                s3.send(new UploadPartCommand({
                    Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                    Key: this.filePath,
                    UploadId: this.uploadId,
                    Body: uploadingChunk,
                    PartNumber: this.writesCount
                })).then((uploadResult) => {
                    console.log(`[AWSS3FileWriteStream._final] File ${this.filePath} write part number`, partNumber, "uploaded");
                    return uploadResult;
                }).catch((err) => {
                    console.log('WriteStream last part UploadPartCommand error', err);
                    callback(err);
                })
            );
        }
        Promise.all(this.uploadResultsPromise)
            .then((uploadResults) => {
                console.log('CompleteMultipartUploadCommand config', {
                    Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                    Key: this.filePath,
                    UploadId: this.uploadId,
                    MultipartUpload: {
                        Parts: uploadResults.map(({ ETag }, i) => ({
                            ETag,
                            PartNumber: i + 1,
                        })),
                    },
                });
                s3.send(
                    new CompleteMultipartUploadCommand({
                        Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                        Key: this.filePath,
                        UploadId: this.uploadId,
                        MultipartUpload: {
                            Parts: uploadResults.map(({ ETag }, i) => ({
                                ETag,
                                PartNumber: i + 1,
                            })),
                        },
                    }),
                )
                    .then((_) => callback())
                    .catch((err) => { console.log('CompleteMultipartUploadCommand error', err); callback(err) });
            })
            .catch((err) => {
                console.log('Promise.all(this.uploadResultsPromise)', err);
                callback(err);
            });
    }

    _destroy(error, callback) {
        console.log("Write Count:", this.writesCount);
        if (error) {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                Key: this.filePath,
            })
            s3.send(deleteCommand).then((_) => callback(error)).catch((_) => callback(error));
        } else {
            callback();
        }
    }
}