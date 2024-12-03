import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
// import { LocalFileSystemAction } from 'service/fileSystem/localFileSystemAction';
// import { LocalFileSystemPath } from 'service/fileSystem/localFileSystemPath';
import { fileSystemActionObject, fileSystemPathObject } from 'initFs';

export class UploadUtils {
    public static async mergeChunks(db: Low<{}>, fileName: string, chunkSum: number | undefined): Promise<void> {
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 1000; // 1 second
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        /**
         * Open file stream, adding chunks into file by command:
         * chunkStream.pipe(writeStream, {end: false})
         */

        const finalFilePath = fileSystemPathObject.uploadVideoFilePath(fileName);
        const writeStream = fileSystemActionObject.createWriteStream(finalFilePath, { highWaterMark: 5 * 1024 * 1024 });
        const uploadChunksState = db.data[fileName];
        const totalPart = chunkSum ?? uploadChunksState.length;
        for (let i = 0; i < totalPart; i++) {
            const chunkName = `${fileName}.part_${i}`;
            console.log('chunkName', chunkName);
            let retries = 0;
            while (retries < MAX_RETRIES) {
                try {
                    const chunkPath = fileSystemPathObject.uploadChunkFilePath(chunkName);
                    const readStream = fileSystemActionObject.createReadStream(chunkPath, { highWaterMark: 512 * 1024 });
                    await new Promise<void>((resolve, reject) => {
                        fileSystemActionObject.addEventListenerReadStream(readStream, 'end', () => {
                            console.log('Readstream part ', i, ' end');
                            fileSystemActionObject.rmFile(chunkPath);
                            resolve();
                        });
                        fileSystemActionObject.addEventListenerReadStream(readStream, 'error', (err) => {
                            console.error(`Error reading chunk ${chunkName}:`, err);
                            reject(err);
                        });
                        try {
                            fileSystemActionObject.pipeReadToWrite(readStream, writeStream, { end: false });
                        } catch (error) {
                            console.error('Piping read stream to write stream error', error);
                        }
                    });
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
        await new Promise<void>((resolve, reject) => {
            fileSystemActionObject.addEventListenerWriteStream(writeStream, 'finish', () => {
                console.log('_final has finish with callback() called');
                resolve();
            });
            writeStream.end(); // Write stream end to trigger _final handler
        });
    }

    public static async splitIntoChunks(fileName: string, chunksSum: number): Promise<void> {
        try {
            const finalFilePath = fileSystemPathObject.uploadVideoFilePath(fileName);
            const finalFileStat = fileSystemPathObject.getFileStatistic(finalFilePath);
            const chunkSize = Math.ceil(finalFileStat.size / chunksSum);
            const readStream = fileSystemActionObject.createReadStream(finalFilePath, { highWaterMark: chunkSize });

            let chunkIndex = 0;

            readStream.on('data', (chunk: Buffer) => {
                console.log('Reading chunk offset, length:', chunk.byteLength, chunk.byteLength);
                const chunkFileName = `${fileName}.part_${chunkIndex}`;
                const chunkFilePath = fileSystemPathObject.uploadChunkFilePath(chunkFileName);
                const writeStream = fileSystemActionObject.createWriteStream(chunkFilePath, { highWaterMark: 5 * 1024 * 1024 });
                fileSystemActionObject.writeChunkToWriteStream(writeStream, chunk, () => {
                    fileSystemActionObject.endWriteStream(writeStream);
                })
                chunkIndex++;
            })

            readStream.on('end', () => {
                console.log('File has been split into chunks.');
                fileSystemActionObject.rmFile(finalFilePath);
            });

            readStream.on('error', (error) => {
                console.error('Error reading the file:', error);
            });

        } catch (error) {
            console.error('Error in splitIntoChunks:', error);
        }
    }

    public static async cleanChunks(baseFileName: string): Promise<void> {
        try {
            const deletingFileRegex = new RegExp(`^${baseFileName}\\.part_(\\d+)$`);
            const deletingFiles = (await fileSystemActionObject.readFormDir(fileSystemPathObject.uploadChunkDirectoryPath(), undefined)).filter((fileChunk) => fileChunk.match(deletingFileRegex));
            for (let file of deletingFiles) {
                fileSystemActionObject.rmFile(path.resolve(fileSystemPathObject.uploadChunkDirectoryPath(), file));
            }
        } catch (error) {
            console.log('Error in cleanChunks:', error);
            throw error;
        }
    }
}