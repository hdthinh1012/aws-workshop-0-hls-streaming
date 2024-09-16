import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
import { LocalFileSystemAction } from 'service/fileSystem/localFileSystemAction';
import { uploadPath, uploadPathChunks, LocalFileSystemPath } from 'service/fileSystem/localFileSystemPath';

export class UploadUtils {
    public static async mergeChunks(db: Low<{}>, fileName: string, chunkSum: number | undefined): Promise<void> {
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 1000; // 1 second
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        /**
         * Open file stream, adding chunks into file by command:
         * chunkStream.pipe(writeStream, {end: false})
         */

        const finalFilePath = LocalFileSystemPath.uploadVideoFilePath(fileName);
        // const finalFilePath = path.resolve(uploadPath, fileName);
        const writeStream = LocalFileSystemAction.createWriteStream(finalFilePath, undefined);
        // const writeStream = fs.createWriteStream(finalFilePath);
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
                    const chunkPath = LocalFileSystemPath.uploadChunkFilePath(chunkName);
                    // const chunkPath = path.resolve(uploadPathChunks, chunkName);
                    const readStream = LocalFileSystemAction.createReadStream(chunkPath, { highWaterMark: 0.5 * 1024 * 1024 });
                    // const readStream = fs.createReadStream(chunkPath, { highWaterMark: 0.5 * 1024 * 1024 });
                    await new Promise<void>((resolve, reject) => {
                        LocalFileSystemAction.pipeReadToWrite(readStream, writeStream, { end: false });
                        // readStream.pipe(writeStream, { end: false });
                        // readStream.on('data', (chunk: Buffer) => {
                        //     // console.log('Reading chunk offset, length:', chunk.byteLength, chunk.byteLength);
                        // })
                        LocalFileSystemAction.addEventListenerReadStream(readStream, 'end', () => {
                            // Delete the chunk file after it has been appended to the final file
                            console.log('Write chunk end');
                            LocalFileSystemAction.rmFile(chunkPath);
                            resolve();
                        });
                        // readStream.on('end', () => {
                        //     // Delete the chunk file after it has been appended to the final file
                        //     console.log('Write chunk end');
                        //     LocalFileSystemAction.rmFile(chunkPath);
                        //     resolve();
                        // });
                        // readStream.on('error', (err) => {
                        //     console.error(`Error reading chunk ${chunkName}:`, err);
                        //     reject(err);
                        // })
                        LocalFileSystemAction.addEventListenerReadStream(readStream, 'error', (err) => {
                            console.error(`Error reading chunk ${chunkName}:`, err);
                            reject(err);
                        });
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

    public static async splitIntoChunks(fileName: string, chunksSum: number): Promise<void> {
        try {
            const finalFilePath = LocalFileSystemPath.uploadVideoFilePath(fileName);
            // const finalFilePath = path.resolve(uploadPath, fileName);
            const finalFileStat = LocalFileSystemPath.getFileStatistic(finalFilePath);
            // const finalFileStat = fs.statSync(finalFilePath);
            const chunkSize = Math.ceil(finalFileStat.size / chunksSum);
            const readStream = LocalFileSystemAction.createReadStream(finalFilePath, { highWaterMark: chunkSize });
            // const readStream = fs.createReadStream(finalFilePath, { highWaterMark: chunkSize });

            let chunkIndex = 0;

            readStream.on('data', (chunk: Buffer) => {
                console.log('Reading chunk offset, length:', chunk.byteLength, chunk.byteLength);
                const chunkFileName = `${fileName}.part_${chunkIndex}`;
                const chunkFilePath = LocalFileSystemPath.uploadChunkFilePath(chunkFileName);
                // const chunkFilePath = path.resolve(uploadPathChunks, chunkFileName);
                const writeStream = LocalFileSystemAction.createWriteStream(chunkFilePath, undefined);
                // const writeStream = fs.createWriteStream(chunkFilePath);
                LocalFileSystemAction.writeChunkToWriteStream(writeStream, chunk, () => {
                    LocalFileSystemAction.endWriteStream(writeStream);
                })
                // writeStream.write(chunk, () => {
                //     writeStream.end();
                // })

                chunkIndex++;
            })

            readStream.on('end', () => {
                console.log('File has been split into chunks.');
                LocalFileSystemAction.rmFile(finalFilePath);
                // fs.unlinkSync(finalFilePath);
            });

            readStream.on('error', (error) => {
                console.error('Error reading the file:', error);
            });

        } catch (error) {
            console.error('Error in splitIntoChunks:', error);
        }
    }

    public static cleanChunks(baseFileName: string): void {
        try {
            const deletingFileRegex = new RegExp(`^${baseFileName}\\.part_(\\d+)$`);
            // const deletingFiles = fs.readdirSync(uploadPathChunks).filter((fileChunk) => fileChunk.match(deletingFileRegex));
            const deletingFiles = LocalFileSystemAction.readFormDir(LocalFileSystemPath.uploadChunkDirectoryPath(), undefined).filter((fileChunk) => fileChunk.match(deletingFileRegex));
            for (let file of deletingFiles) {
                // fs.rmSync(path.resolve(uploadPathChunks, file));
                LocalFileSystemAction.rmFile(path.resolve(LocalFileSystemPath.uploadChunkDirectoryPath(), file));
            }
        } catch (error) {
            console.log('Error in cleanChunks:', error);
            throw error;
        }
    }
}