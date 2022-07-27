import Global from '../Global';
import { BuildData, VariableData } from '../data/BuildData';
import FileHandle from '../util/FileHandle';
import { arrayToJson, mergeJson } from './JSONMerge';

function foreachJson(json: any, fun: (path: string, key: string, value: any) => boolean, path: string): boolean {
    for (const key in json) {
        if (typeof (json[key]) === "object") {
            if (fun(path + key, key, json[key])) {
                foreachJson(json[key], fun, path + key + "/");
            }
        } else {
            fun(path + key, key, json[key]);
        }
    }
    return true;
}

function process(savePath: FileHandle, data: VariableData, paths: string[]) {
    const res: any = {};
    for (let simplePath of paths) {
        let simpleFolder = new FileHandle(simplePath);
        for (let vars of data.from) {
            if (!simpleFolder.child(vars.path).existsSync()) {
                continue;
            }
            const r = new RegExp(vars.jsonPath);
            simpleFolder.child(vars.path).forEachSync(element => {
                let json;
                try {
                    json = eval("(" + element.readSync() + ")");
                    if(typeof(json) !== "object") {
                        throw new Error("Invalid JSON");
                    }
                } catch (e) {
                    console.error(e);
                    return;
                }
                foreachJson(json, (path, key, value) => {
                    let further = r.test(path);

                    if (further) {
                        if (vars.use === "kv") {
                            res[key] = true;
                            let nkey = key + "$__*simple__";
                            // eslint-disable-next-line eqeqeq
                            if (res[nkey] == null) {
                                res[nkey] = [];
                            }
                            if (res[nkey].length < Global.instance.maxSimple) {
                                res[nkey].push(value);
                            }

                            res[key] = false;
                            further = false;
                            nkey = key + "$__*mix__";
                            let nvalue: any = {};
                            nvalue[nkey] =JSON.parse(JSON.stringify(value));
                            arrayToJson(nvalue);
                            mergeJson(res, nvalue);
                        } else if (vars.use === "k") {
                            res[key] = false;
                            further = false;
                            let nkey = key + "$__*mix__";
                            let nvalue: any = {};
                            nvalue[nkey] = value;
                            arrayToJson(nvalue);
                            mergeJson(res, nvalue);
                        }

                    }
                    return !further;
                }, "/");
            });
        }
    }

    savePath.write(JSON.stringify(res));
}

export function build() {
    const dbfile = Global.cacheDir.child("build");
    dbfile.mkdir();
    for (let v of BuildData.instance.variable) {
        if (v.name.startsWith("$beh")) {
            process(dbfile.child(v.name), v, Global.instance.behSimpleFiles);
        }
        if (v.name.startsWith("$res")) {
            process(dbfile.child(v.name), v, Global.instance.resSimpleFiles);
        }
    }
}

export function getCompletionSource(varname: string) {
    if (!Global.instance.inProgram) {
        throw new Error("isn't in program");
    }
    return JSON.parse(Global.cacheDir.child("build").enter(varname).readSync());
}