export function isNumber(value: string): boolean {
    return parseFloat(value).toString() !== "NaN";
}

export function includes<T>(arr: Array<T>, eq: (a: T, b: T) => boolean, ele: T): boolean {
    for (let i = 0; i < arr.length; i++) {
        if (eq(arr[i], ele)) { return true; }
    }
    return false;
}