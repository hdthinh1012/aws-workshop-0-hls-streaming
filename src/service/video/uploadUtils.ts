import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
// import { LocalFileSystemAction } from 'service/fileSystem/localFileSystemAction';
// import { LocalFileSystemPath } from 'service/fileSystem/localFileSystemPath';
import { FileSystemActionType, FileSystemPathType } from 'initFs';

export class UploadUtils {
    public static async mergeChunks(db: Low<{}>, fileName: string, chunkSum: number | undefined): Promise<void> {
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 1000; // 1 second
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        /**
         * Open file stream, adding chunks into file by command:
         * chunkStream.pipe(writeStream, {end: false})
         */

        const finalFilePath = FileSystemPathType.uploadVideoFilePath(fileName);
        const writeStream = FileSystemActionType.createWriteStream(finalFilePath, undefined);
        const uploadChunksState = db.data[fileName];
        const totalPart = chunkSum ?? uploadChunksState.length;
        for (let i = 0; i < totalPart; i++) {
            const chunkName = `${fileName}.part_${i}`;
            console.log('chunkName', chunkName);
            let retries = 0;
            while (retries < MAX_RETRIES) {
                console.log('inside retry');
                try {
                    const chunkPath = FileSystemPathType.uploadChunkFilePath(chunkName);
                    const readStream = FileSystemActionType.createReadStream(chunkPath, { highWaterMark: 16 * 1024 * 1024 });
                    await new Promise<void>((resolve, reject) => {
                        FileSystemActionType.addEventListenerReadStream(readStream, 'end', () => {
                            console.log('Write chunk end');
                            FileSystemActionType.rmFile(chunkPath);
                            resolve();
                        });
                        FileSystemActionType.addEventListenerReadStream(readStream, 'error', (err) => {
                            console.error(`Error reading chunk ${chunkName}:`, err);
                            reject(err);
                        });
                        try {
                            FileSystemActionType.pipeReadToWrite(readStream, writeStream, { end: false });
                        } catch (error) {
                            console.error('Piping read stream to write stream error', error);
                        }
                        // FileSystemActionType.addEventListenerReadStream(readStream, 'data', (chunk) => {
                        //     console.error(`Chunking pushing from read stream to write stream: ${chunk}`);
                        // });
                        // console.log('readStream after pipe', readStream);
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
        writeStream.end();
    }

    public static async splitIntoChunks(fileName: string, chunksSum: number): Promise<void> {
        try {
            const finalFilePath = FileSystemPathType.uploadVideoFilePath(fileName);
            const finalFileStat = FileSystemPathType.getFileStatistic(finalFilePath);
            const chunkSize = Math.ceil(finalFileStat.size / chunksSum);
            const readStream = FileSystemActionType.createReadStream(finalFilePath, { highWaterMark: chunkSize });

            let chunkIndex = 0;

            readStream.on('data', (chunk: Buffer) => {
                console.log('Reading chunk offset, length:', chunk.byteLength, chunk.byteLength);
                const chunkFileName = `${fileName}.part_${chunkIndex}`;
                const chunkFilePath = FileSystemPathType.uploadChunkFilePath(chunkFileName);
                const writeStream = FileSystemActionType.createWriteStream(chunkFilePath, undefined);
                FileSystemActionType.writeChunkToWriteStream(writeStream, chunk, () => {
                    FileSystemActionType.endWriteStream(writeStream);
                })
                chunkIndex++;
            })

            readStream.on('end', () => {
                console.log('File has been split into chunks.');
                FileSystemActionType.rmFile(finalFilePath);
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
            const deletingFiles = await FileSystemActionType.readFormDir(FileSystemPathType.uploadChunkDirectoryPath(), undefined).filter((fileChunk) => fileChunk.match(deletingFileRegex));
            for (let file of deletingFiles) {
                FileSystemActionType.rmFile(path.resolve(FileSystemPathType.uploadChunkDirectoryPath(), file));
            }
        } catch (error) {
            console.log('Error in cleanChunks:', error);
            throw error;
        }
    }
}