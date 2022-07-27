export function mergeJson(a: any, b: any) {
    for (let i in b) {
        // eslint-disable-next-line eqeqeq
        if (a[i] == null) {
            a[i] = b[i];
        } else if (a[i] instanceof Array) {
            if (b[i] instanceof Array) {
                console.log("errer");
                console.log(b);

                throw new Error("ArrayToJson");

            } else if (typeof (b[i]) === "object") {
                if (a[i].length > 0 && a[i][0] instanceof Array) {
                    console.log("errer");
                    console.log(a);

                    throw new Error("Array ???");
                } else if (a[i].length > 0 && typeof (a[i][0]) === "object") {
                    mergeJson(a[i][0], b[i]);
                } else {
                    a[i].unshift(b[i]);
                }
            } else {
                if (a[i].indexOf(b[i]) === -1) { a[i].push(b[i]); };
            }
        } else if (typeof (a[i]) === "object") {
            if (b[i] instanceof Array) {
                a[i] = [a[i], b[i]];
            } else if (typeof (b[i]) === "object") {
                mergeJson(a[i], b[i]);
            } else {
                a[i] = [a[i], b[i]];
            }
        } else {
            if (b[i] instanceof Array) {
                a[i] = [a[i]].concat(b[i]);
            } else if (typeof (b[i]) === "object") {
                a[i] = [b[i], a[i]];
            } else {
                a[i] = [a[i], b[i]];
            }
        }
    }
}

export function arrayToJson(json: any) {
    for (let i in json) {
        if (json[i] instanceof Array) {
            let nvalue: any = {};
            for (let j in json[i]) {
                nvalue[j] = json[i][j];
            }
            json[i] = nvalue;
        }

        if (typeof (json[i]) === "object") {
            arrayToJson(json[i]);
        }
    }
}