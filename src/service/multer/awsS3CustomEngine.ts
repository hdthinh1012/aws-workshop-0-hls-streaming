import { Request } from "express";
import multer from "multer";
import path from "path";

import {
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    S3Client,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3, jsonSecret } from "service/fileSystem/awsS3Config";
import { fileSystemPathObject } from "initFs";

type nameFnType = (req: Request, file: Express.Multer.File) => string;

type Options = {
    nameFn?: nameFnType
}

const defaultNameFn: nameFnType = (
    _req: Request,
    file: Express.Multer.File
) => {
    return file.originalname;
};

interface CustomFileResult extends Partial<Express.Multer.File> {
    name: string;
}

export const multipartUploadPartSize = 6 * 1024 * 1024;

export class AWSS3CustomStorageEngine implements multer.StorageEngine {
    private nameFn: nameFnType;

    constructor(opts: Options) {
        this.nameFn = opts.nameFn || defaultNameFn;
    }

    async _handleFile(req: Request, file: Express.Multer.File, callback: (error?: any, info?: Partial<Express.Multer.File>) => void): Promise<void> {
        if (!s3) {
            callback(new Error("S3 Client not exist!!!"));
        }

        const fileName = this.nameFn(req, file);
        const chunkReadStream = file.stream;
        const chunkS3Path = fileSystemPathObject.uploadChunkFilePath(fileName);

        let uploadId: string;
        let tmpBuffer: Buffer = Buffer.alloc(0);
        try {
            const multipartUpload = await s3.send(
                new CreateMultipartUploadCommand({
                    Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                    Key: chunkS3Path,
                }),
            );
            uploadId = multipartUpload.UploadId;
            const uploadResults = [];

            let partNumberCnt = 0;
            chunkReadStream.on('data', async (chunk: Buffer) => {
                tmpBuffer = Buffer.concat([tmpBuffer, chunk]);
            });

            let fileSize;
            chunkReadStream.on('end', async () => {
                fileSize = tmpBuffer.byteLength;
                try {
                    while (tmpBuffer.byteLength > 0) {
                        const cutBuffer = tmpBuffer.subarray(0, multipartUploadPartSize);
                        tmpBuffer = tmpBuffer.subarray(multipartUploadPartSize);
                        let partNumber = partNumberCnt + 1;
                        console.log('Reading buffer length:', cutBuffer.byteLength);
                        const uploadResult = await s3.send(new UploadPartCommand({
                            Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                            Key: chunkS3Path,
                            UploadId: uploadId,
                            Body: cutBuffer,
                            PartNumber: partNumber
                        }))
                        console.log("Part", partNumber, "uploaded");
                        uploadResults.push(uploadResult);
                        console.log('Reading tmpBuffer done length:', tmpBuffer.byteLength);
                        partNumberCnt += 1;
                    }
                } catch (error) {
                    console.error('UploadPartCommand error:', error);
                }

                console.log('Prepare complete upload command');
                try {
                    const res = await s3.send(
                        new CompleteMultipartUploadCommand({
                            Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                            Key: chunkS3Path,
                            UploadId: uploadId,
                            MultipartUpload: {
                                Parts: uploadResults.map(({ ETag }, i) => ({
                                    ETag,
                                    PartNumber: i + 1,
                                })),
                            },
                        }),
                    );
                    callback(null, {
                        fieldname: 'video',
                        originalname: fileName,
                        size: fileSize
                    });
                } catch (error) {
                    console.error('CompleteMultipartUploadCommand error:', error);
                }
            });

            chunkReadStream.on('error', (error) => {
                console.error('Error reading the file:', error);
            });
        } catch (err) {
            if (uploadId) {
                const abortCommand = new AbortMultipartUploadCommand({
                    Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                    Key: chunkS3Path,
                    UploadId: uploadId,
                });

                await s3.send(abortCommand);
            }
        }
    }

    async _removeFile(req: Request, file: Express.Multer.File, callback: (error: Error | null) => void): Promise<void> {
        const fileName = this.nameFn(req, file);
        const chunkS3Path = fileSystemPathObject.uploadChunkFilePath(fileName);
        const deleteCommand = new DeleteObjectCommand({
            Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
            Key: chunkS3Path,
        })
        await s3.send(deleteCommand);
    }
}