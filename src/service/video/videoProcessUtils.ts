import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Low } from 'lowdb/lib';
import path from 'path';
import { exec } from 'child_process';
import { EncodeUtils } from './encodeUtils';

export const uploadPath = path.resolve('uploads/videos');
export const uploadPathChunks = path.resolve('uploads/tmp');
export const streamPath = path.resolve('streams');


export class VideoProcessUtils {
    public static async generateMasterPlaylist(fileName: string): Promise<any> {
        const uploadInfo = {
            url: `${process.env.SERVER_URL}/static/${fileName}`,
            bitrate: 0,
            resolution: {},
            codec: '',
        };
        uploadInfo.bitrate = await this.getBitrate(fileName);
        uploadInfo.resolution = await this.getResolution(fileName);
        uploadInfo.codec = await this.getCodec(fileName);
        await EncodeUtils.encodeHLS(fileName, uploadInfo);
    }

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
        }
        return videoInfos;
    }

    static async isAudioStreamExist(fileName: string): Promise<boolean> {
        return new Promise<boolean>
            ((resolve, reject) => {
                exec(`ffprobe -i ${path.resolve(uploadPath, fileName)} -v error -select_streams a:0 -show_entries stream=codec_type -of default=nw=1:nk=1`,
                    (err, stdout, stderr) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(stdout.trim() === 'audio');
                    }
                )
            });
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
                    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json ${path.resolve(uploadPath, fileName)}`,
                    (err, stdout, stderr) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(JSON.parse(stdout.trim())["streams"][0])
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