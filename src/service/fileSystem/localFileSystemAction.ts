import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { Writable, Readable } from "node:stream";

export abstract class AbstractFileSystemAction {
    public abstract readFormDir(path: string, options: { [key: string]: any } | undefined): Promise<string[]>;

    public abstract createDir(path, options: { [key: string | number | symbol]: any } | undefined): void;

    public abstract rmDirectory(path: string, options: { [key: string | number | symbol]: any } | undefined): Promise<void>;

    public abstract rmFile(path: string): void;

    public abstract createWriteStream(path: string, options: any): Writable;

    public abstract createReadStream(path: string, options: any): Readable;

    public abstract pipeReadToWrite(readStream: Readable, writeStream: Writable, options: any): void;

    public abstract addEventListenerReadStream(readStream: Readable, event: string, handler: (...args: any[]) => void): void;

    public abstract addEventListenerWriteStream(writeStream: Writable, event: string, handler: (...args: any[]) => void): void;

    public abstract writeChunkToWriteStream(writeStream: Writable, chunk: any, callback: any): void;

    public abstract endWriteStream(writeStream: Writable): void;
}

export class LocalFileSystemAction extends AbstractFileSystemAction {
    public override async readFormDir(path: string, options: { [key: string]: any } | undefined): Promise<string[]> {
        try {
            return fs.readdirSync(path);
        } catch (error) {
            console.error('LocalFileSystemAction.readFormDir error:', error);
        }
    }

    public override createDir(path, options: { [key: string | number | symbol]: any } | undefined): void {
        try {
            fs.mkdirSync(path, options);
        } catch (error) {
            console.error('LocalFileSystemAction.rmDirectory error:', error);
        }
    }

    public override async rmDirectory(path: string, options: { [key: string | number | symbol]: any } | undefined): Promise<void> {
        try {
            fs.rmSync(path, options);
        } catch (error) {
            console.error('LocalFileSystemAction.rmDirectory error:', error);
        }
    }

    public override rmFile(path: string): void {
        try {
            fs.unlinkSync(path);
        } catch (error) {
            console.error('LocalFileSystemAction.rmFile error:', error);
        }
    }

    public override createWriteStream(path: string, options: any): Writable {
        return fs.createWriteStream(path, options);
    }

    public override createReadStream(path: string, options: any): Readable {
        return fs.createReadStream(path, options);
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