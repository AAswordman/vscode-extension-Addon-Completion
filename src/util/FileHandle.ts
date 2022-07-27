import { TextDecoder } from "util";
import { FileType, Uri, workspace } from "vscode";
import * as fs from 'fs';

export default class FileHandle {
    async forEach(func: (element: FileHandle) => void) {
        if(!this.isDirSync()) {
            func(this);
            return;
        }
        let files = await this.listFiles();
        for (let f of files) {
            if (await f.isdir()) {
                f.forEach(func);
            } else {
                func(f);
            }
        }
    }
    forEachSync(func: (element: FileHandle) => void) {
        if(!this.isDirSync()) {
            func(this);
            return;
        }
        let files = this.listFilesSync();
        for (let f of files) {
            if (f.isDirSync()) {
                f.forEachSync(func);
            } else {
                func(f);
            }
        }
    }
    path: string;
    constructor(path: string) {
        this.path = path;
        if (path.endsWith("/")) {
            this.path = path.substring(0, path.length - 1);
        }
    }
    static fromUri(uri: Uri) {
        return new FileHandle(uri.path);
    }

    getUri() {
        return Uri.file(this.path);
    }
    getFsPath() {
        return this.path.substring(1).replace(":/", "://");

    }
    /**
     * 获取内容
     */
    async read() {
        return new TextDecoder().decode(await workspace.fs.readFile(this.getUri()));
    }

    readSync() {
        return new TextDecoder().decode(fs.readFileSync(this.getFsPath()));
    }

    /**
     * 写入内容
     */
    write(msg: string) {
        workspace.fs.writeFile(this.getUri(), new TextEncoder().encode(msg));
    }

    /**
     * 返回文件列表
     */
    async listFiles() {
        let files: FileHandle[] = [];
        let result = await workspace.fs.readDirectory(this.getUri());
        for (let i of result) {
            files.push(new FileHandle(this.path).enter(i[0]));
        }
        return files;
    }

    listFilesSync() {
        return fs.readdirSync(this.getFsPath()).map<FileHandle>((value) => {
            return new FileHandle(this.path).enter(value);
        });
    }

    /**
     * 路径改为子文件夹的路径
     */
    enter(filename: string) {
        if (this.isRoot()) {
            this.path += filename;
        } else {
            this.path += "/" + filename;
        }

        return this;
    }

    /**
     * 返回子文件夹
     */
    child(filename: string) {
        return new FileHandle(this.path).enter(filename);
    }

    /**
     * 返回是否为文件夹
     */
    async isdir() {
        let state = await workspace.fs.stat(this.getUri());
        return state.type === FileType.Directory;
    }

    isDirSync() {
        return fs.statSync(this.getFsPath()).isDirectory();
    }

    /**
     * 创建文件夹
     */
    mkdir() {
        workspace.fs.createDirectory(this.getUri());
    }

    /**
     * 创建文件夹，如果父文件夹不存在则会创建
     */
    async mkdirs() {
        let parent = this.parent();
        if (!parent.isRoot() && !await parent.exists()) {
            parent.mkdirs();
        }
        this.mkdir();
    }


    /**
     * 返回文件是否存在
     */
    async exists() {
        try {
            let state = await workspace.fs.stat(this.getUri());
            return true;
        } catch (err) {
            return false;
        }
    }

    existsSync(){
        return fs.existsSync(this.getFsPath());
    }

    /**
     * 路径改为父文件夹的路径
     */
    back() {
        if (!this.isRoot()) { this.path = this.path.substring(0, this.path.lastIndexOf("/")); }
        if (this.path.endsWith(":")) { this.path += "/"; }
        return this;
    }

    /**
     * 获取父文件夹
     */
    parent() {
        return new FileHandle(this.path).back();
    }


    /**
     * 返回文件名
     */
    name() {
        return this.path.substring(this.path.lastIndexOf("/") + 1);
    }

    /**
     * 返回是否为根目录
     */
    isRoot() {
        return this.path.endsWith(":/") || this.path.endsWith("://");
    }

}