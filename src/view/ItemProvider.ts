import {
    CompletionItemProvider,
    TextDocument,
    Position,
    CancellationToken,
    CompletionContext,
    ProviderResult,
    CompletionList,
    CompletionItem,
    Range
} from "vscode";
import { getCompletionSource } from "../lib/ProgramProcess";
import FileHandle from '../util/FileHandle';
import { BuildData, VariableData, VariablePath } from '../data/BuildData';
import { isNumber, includes } from '../util/tool';

export default class ItemProvider implements CompletionItemProvider {
    static reg = BuildData.instance.completion.map<RegExp>(e => {
        return new RegExp(e.path);
    });
    constructor() {

        BuildData.instance.completion.map(e => {
            e.jsonPattern = [new RegExp("^" + e.jsonPath + "$"), new RegExp("^" + e.jsonPath)];
        });
    }
    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionList<CompletionItem> | CompletionItem[]> {
        let file = FileHandle.fromUri(document.uri).getFsPath();
        let data = BuildData.instance.completion;

        data = data.filter((item, index, array) => {
            return ItemProvider.reg[index].test(file);
        });
        let surface = getSurface(document.getText(new Range(new Position(0, 0), position)));

        let data1 = data.filter((item, index, array) => {
            return item.jsonPattern[0].test(surface);
        });
        let data2 = data.filter((item, index, array) => {
            return item.jsonPattern[1].test(surface);
        });
        let res: CompletionItem[] = [];

        for (let index in data2) {
            let d = data2[index];
            let source = getCompletionSource(d.use);
            let path = surface.replace(d.jsonPattern[1], "").split("/");
            let shift = <string>path.shift();
            // eslint-disable-next-line eqeqeq
            if (surface.endsWith("/")) { path.pop(); }
            let target = shift + "$__*mix__";
            // eslint-disable-next-line eqeqeq
            if (source[target] == null) { continue; }
            let comp = [source[target]];
            let ncomp = [];
            let num = false;

            for (let j of path) {
                num = isNumber(j);
                for (let k in comp) {
                    // eslint-disable-next-line eqeqeq
                    if (typeof (comp[k]) !== "object" || comp[k][j] == null) { continue; }
                    if (num) {
                        for (let y in comp[k]) {
                            if (isNumber(y)) {
                                if (comp[k][y] instanceof Array) {
                                    for (let s in comp[k][y]) {
                                        ncomp.push(comp[k][y][s]);
                                    }
                                } else {
                                    ncomp.push(comp[k][y]);
                                }
                            }
                        }
                    } else {
                        if (comp[k][j] instanceof Array) {
                            for (let s in comp[k][j]) {
                                ncomp.push(comp[k][j][s]);
                            }
                        } else {
                            ncomp.push(comp[k][j]);
                        }
                    }
                }
                comp = ncomp;
                ncomp = [];
            }

            for (let v of comp) {
                if (surface.endsWith("/")) {
                    for (let i in v) {
                        res.push(new CompletionItem(i));
                    }
                } else {
                    if (v instanceof Array) {
                        for (let j of v) {
                            res.push(new CompletionItem(j));
                        }
                    } else {
                        res.push(new CompletionItem(v));
                    }

                }
            }
        }

        for (let d of data1) {
            let source = getCompletionSource(d.use);
            for (let i in source) {
                let item = new CompletionItem(i);
                if (i.endsWith("$__*simple__")) {
                    item.label = i.replace("$__*simple__", ' Simple');
                    let comp = source[i][Math.floor(Math.random() * source[i].length)];
                    item.insertText = `"${i.replace("$__*simple__", '')}":${typeof (comp) === "string" ? "\"" + comp + "\"" : (typeof (comp) === "object" ? JSON.stringify(comp, null, "\t") : comp)},`;
                }
                if (!i.endsWith("$__*mix__")) {
                    res.push(item);
                }
            }
        }
        let nres:CompletionItem[]=[];
        let set=new Map<string,CompletionItem>();
        for(let i of res) {
            set.set(<string>i.label,i);
        }
        for(let i of set){
            nres.push(i[1]);
        }
        return nres;
    }
}
function getSurface(arg0: string) {
    let keyList = new Array<string>();
    let trans = false;
    let systemList = new Array<number>();
    let inStr = false;
    let s = new Array<string>();
    let keyBuilder = "";
    let keyCache: any = "";
    let isEmpty = false;

    for (let c of arg0) {
        switch (c) {
            case '{': {
                if (!inStr) {
                    if (keyCache !== null) {
                        s.push("/");
                        keyCache = null;
                    } else {
                        s.push("/");
                    }
                    systemList.push(-1);
                    isEmpty = true;
                }
                continue;
            }

            case '[': {
                if (!inStr) {
                    if (keyCache !== null) {
                        s.push("/");
                        keyCache = null;
                    } else {
                        s.push("/");
                    }
                    systemList.push(0);
                    keyCache = 0 + "";
                    s.push(keyCache);
                }
                continue;
            }
            case '"': {
                if (!trans) {
                    if (inStr) {
                        inStr = false;
                        keyCache = keyBuilder;
                        keyBuilder = "";
                    } else {

                        inStr = true;
                    }

                    continue;
                }
                break;
            }
            case ':': {
                if (!inStr) {
                    isEmpty = false;
                    if (keyCache !== null) {
                        s.push(keyCache);
                        keyCache = null;
                    } else {
                        s.push("" + systemList[(systemList.length - 1)]);
                    }


                }
                break;
            }
            case ',': {
                if (!inStr) {
                    let nowKey = systemList[(systemList.length - 1)];
                    if (nowKey !== -1) {
                        systemList[systemList.length - 1] = nowKey + 1;
                        keyCache = (nowKey + 1) + "";
                        s.pop();
                        s.push(keyCache);
                    } else {
                        s.pop();
                    }
                }
                break;
            }
            case '}': {
                if (!inStr) {
                    systemList.pop();
                    s.pop();
                    if (!isEmpty) { s.pop(); }
                    isEmpty = false;
                }
                continue;
            }
            case ']': {
                if (!inStr) {
                    systemList.pop();
                    s.pop();
                    s.pop();

                }
                continue;
            }
        }
        //str
        if (inStr) {
            keyBuilder += c;
        }
        if (c === '\\' && !trans) {
            trans = true;
        } else if (trans) {
            trans = false;
        }
    }
    return s.join("");
}