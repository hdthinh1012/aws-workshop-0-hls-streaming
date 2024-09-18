import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Writable, Readable } from "node:stream";

export abstract class AbstractFileSystemAction { }

export class LocalFileSystemAction extends AbstractFileSystemAction {
    public static async readFormDir(path: string, options: { [key: string]: any } | undefined): Promise<string[]> {
        try {
            return fs.readdirSync(path);
        } catch (error) {
            console.error('LocalFileSystemAction.readFormDir error:', error);
        }
    }

    public static createDir(path, options: { [key: string | number | symbol]: any } | undefined): void {
        try {
            fs.mkdirSync(path, options);
        } catch (error) {
            console.error('LocalFileSystemAction.rmDirectory error:', error);
        }
    }

    public static rmDirectory(path: string, options: { [key: string | number | symbol]: any } | undefined): void {
        try {
            fs.rmSync(path, options);
        } catch (error) {
            console.error('LocalFileSystemAction.rmDirectory error:', error);
        }
    }

    public static rmFile(path: string): void {
        try {
            fs.unlinkSync(path);
        } catch (error) {
            console.error('LocalFileSystemAction.rmFile error:', error);
        }
    }

    public static createWriteStream(path: string, options: any): Writable {
        return fs.createWriteStream(path, options);
    }

    public static createReadStream(path: string, options: any): Readable {
        return fs.createReadStream(path, options);
    }

    public static pipeReadToWrite(readStream: Readable, writeStream: Writable, options: any) {
        readStream.pipe(writeStream, options);
    }

    public static addEventListenerReadStream(readStream: Readable, event: string, handler: (...args: any[]) => void) {
        readStream.on(event, handler);
    }

    public static writeChunkToWriteStream(writeStream: Writable, chunk: any, callback: any) {
        writeStream.write(chunk, callback);
    }

    public static endWriteStream(writeStream: Writable) {
        writeStream.end();
    }
}