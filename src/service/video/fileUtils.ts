import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';

export const uploadPath = 'uploads/videos';
export const uploadPathChunks = 'uploads/tmp';

export class FileUtils {
    public static async mergeChunks(db: Low<{}>, fileName: string, chunkSum: number | undefined): Promise<void> {
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 1000; // 1 second
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        /**
         * Open file stream, adding chunks into file by command:
         * chunkStream.pipe(writeStream, {end: false})
         */

        const finalFilePath = `${uploadPath}/${fileName}`;
        const writeStream = fs.createWriteStream(finalFilePath);

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
                    const chunkPath = `${uploadPathChunks}/${chunkName}`;
                    const readStream = fs.createReadStream(chunkPath, { highWaterMark: 0.5 * 1024 * 1024 });
                    await new Promise<void>((resolve, reject) => {
                        readStream.pipe(writeStream, { end: false });
                        readStream.on('data', (chunk: Buffer) => {
                            // console.log('Reading chunk offset, length:', chunk.byteLength, chunk.byteLength);
                        })
                        readStream.on('end', () => {
                            // Delete the chunk file after it has been appended to the final file
                            console.log('Write chunk end');
                            fs.unlinkSync(chunkPath);
                            resolve();
                        });
                        readStream.on('error', (err) => {
                            console.error(`Error reading chunk ${chunkName}:`, err);
                            reject(err);
                        })
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
            const finalFilePath = `${uploadPath}/${fileName}`;
            const finalFileStat = fs.statSync(finalFilePath);
            const chunkSize = Math.ceil(finalFileStat.size / chunksSum);
            const readStream = fs.createReadStream(finalFilePath, { highWaterMark: chunkSize });

            let chunkIndex = 0;

            readStream.on('data', (chunk: Buffer) => {
                console.log('Reading chunk offset, length:', chunk.byteLength, chunk.byteLength);
                const chunkFileName = `${fileName}.part_${chunkIndex}`;
                const chunkFilePath = path.join(uploadPathChunks, chunkFileName);
                const writeStream = fs.createWriteStream(chunkFilePath);

                writeStream.write(chunk, () => {
                    writeStream.end();
                })

                chunkIndex++;
            })

            readStream.on('end', () => {
                console.log('File has been split into chunks.');
                fs.unlinkSync(finalFilePath);
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
            const deletingFiles = fs.readdirSync(`${uploadPathChunks}`).filter((fileChunk) => fileChunk.match(deletingFileRegex));
            for (let file of deletingFiles) {
                fs.rmSync(`${uploadPathChunks}/${file}`);
            }
        } catch (error) {
            console.log('Error in cleanChunks:', error);
            throw error;
        }
    }
}