import FileHandle from "./util/FileHandle";

export default class Global {
    static cacheDir: FileHandle = new FileHandle("D://addon-cache");

    behSimpleFiles: string[] = [];
    resSimpleFiles: string[] = [];
    maxSimple: number = 5;
    static instance: Global;
	inProgram!: boolean;

    constructor(){
        
    }
}