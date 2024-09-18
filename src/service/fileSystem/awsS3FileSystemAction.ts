import { AbstractFileSystemAction } from "./localFileSystemAction";
import { s3 } from 'service/fileSystem/awsS3Config';
import {
    ListObjectsV2Command,
    GetObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    _Object,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand
} from "@aws-sdk/client-s3";
import { jsonSecret } from "service/fileSystem/awsS3Config";
import fs from "fs";
import { Writable, Readable } from "node:stream";

import { AWSS3FileWriteStream } from "./awsS3FileWriteStream";
import { AWSS3FileReadStream } from "./awsS3FileReadStream";

export class AWSS3FileSystemAction extends AbstractFileSystemAction {
    public override async readFormDir(path: string, options: { [key: string]: any } | undefined): Promise<string[]> {
        try {
            // const listObjectRequest = new ListObjectsV2Command({
            //     Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
            //     Prefix: path,
            // });
            // const data = await s3.send(listObjectRequest);
            // const promiseUrls = data.Contents?.map(async (item: _Object) => {
            //     return item.Key;
            // });
            // return Promise.all(promiseUrls ?? []);
            return fs.readdirSync(path);
        } catch (error) {
            console.error('AWSS3FileSystemAction.readFormDir error:', error);
        }
    }

    public override createDir(path, options: { [key: string | number | symbol]: any } | undefined): void {
        try {
            /**
             * AWS using flat structure, no create directory command exist
             */
        } catch (error) {
            console.error('LocalFileSystemAction.rmDirectory error:', error);
        }
    }

    public override async rmDirectory(path: string, options: { [key: string | number | symbol]: any } | undefined): Promise<void> {
        try {
            let count = 0;
            let bucketName = jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "";
            /**
             * AWS S3 using flat file system structure,
             * directory is a grouping mechanism for easy structuring only.
             */
            let continueToken = undefined;
            while (true) {
                const listCommand = new ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: path,
                    ContinuationToken: continueToken
                });
                let dataList = await s3.send(listCommand);
                if (dataList.KeyCount) { // items left to delete
                    const deleteCommand = new DeleteObjectsCommand({
                        Bucket: bucketName,
                        Delete: {
                            Objects: dataList.Contents.map(data => ({ Key: data.Key })),
                            Quiet: false
                        }
                    });
                    let deletedRes = await s3.send(deleteCommand);
                    count += deletedRes.Deleted.length;
                    if (deletedRes.Errors) {
                        deletedRes.Errors.map((error) => console.error(`${error.Key} deleted failed!`))
                    }
                }
                if (dataList.ContinuationToken) { // bucket had more than 1000 objects
                    continueToken = dataList.ContinuationToken;
                    continue;
                } else {
                    console.log(`AWSS3FileSystemAction.rmDirectory: ${count} files deleted`);
                    break;
                }
            }
        } catch (error) {
            console.error('AWSS3FileSystemAction.rmDirectory error:', error);
        }
    }

    public override async rmFile(path: string): Promise<void> {
        try {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: jsonSecret.BUCKET_NAME ? jsonSecret.BUCKET_NAME : "",
                Key: path,
            });
            await s3.send(deleteCommand);
        } catch (error) {
            console.error('AWSS3FileSystemAction.rmFile error:', error);
        }
    }

    public override createReadStream(path: string, options: any): Readable {
        // return fs.createReadStream(path, options);
        return new AWSS3FileReadStream({ highWaterMark: 16 * 1024 * 1024, filePath: path });
    }

    public override createWriteStream(path: string, options: any): Writable {
        // return fs.createWriteStream(path, options);
        return new AWSS3FileWriteStream({ highWaterMark: 16 * 1024 * 1024, filePath: path });
    }

    public override pipeReadToWrite(readStream: Readable, writeStream: Writable, options: any) {
        readStream.pipe(writeStream, options);
    }

    public override addEventListenerReadStream(readStream: Readable, event: string, handler: (...args: any[]) => void) {
        readStream.on(event, handler);
    }

    public addEventListenerWriteStream(writeStream: Writable, event: string, handler: (...args: any[]) => void): void {
        writeStream.on(event, handler);
    }

    public override writeChunkToWriteStream(writeStream: Writable, chunk: any, callback: any) {
        writeStream.write(chunk, callback);
    }

    public override endWriteStream(writeStream: Writable) {
        writeStream.end();
    }
}