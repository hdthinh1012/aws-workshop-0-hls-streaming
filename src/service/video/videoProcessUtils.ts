import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
import { exec } from 'child_process';

export const uploadPath = 'uploads/videos';
export const uploadPathChunks = 'uploads/tmp';

export class VideoProcessUtils {
    public static async getAllInfos(): Promise<any[]> {
        const videos = fs.readdirSync(uploadPath);
        let videoInfos = [];
        for (let video of videos) {
            const info = {
                url: `${process.env.SERVER_URL}/static/${video}`
            };
            info['bitrate'] = await this.getBitrate(video);
            info['resolution'] = await this.getResolution(video);
            info['codec'] = await this.getCodec(video);
            videoInfos.push({
                name: video,
                info: info
            });

            // exec(`ls`, (err, stdout, stderr) => {
            //     if (err) {
            //         throw `Error getting info of ${video}: ${err}`;
            //     } else {
            //         videoInfos.push({
            //             name: video,
            //             info: stdout.trim()
            //         });
            //     }
            // });
        }
        return videoInfos;
    }

    static async getBitrate(fileName: string): Promise<number> {
        return new Promise<number>
            ((resolve, reject) => {
                exec(
                    `ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of default=nw=1:nk=1  ${path.resolve(uploadPath, fileName)}`,
                    (err, stdout, stderr) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(Number(stdout.trim()))
                    }
                )
            });
    }

    static async getResolution(fileName: string): Promise<string> {
        return new Promise<string>
            ((resolve, reject) => {
                exec(
                    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of default=nw=1 ${path.resolve(uploadPath, fileName)}`,
                    (err, stdout, stderr) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(stdout.trim())
                    }
                )
            });

    }

    static async getCodec(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            exec(
                `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 ${path.resolve(uploadPath, fileName)}`,
                (err, stdout, stderr) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(stdout.trim())
                }
            )
        });
    }
}