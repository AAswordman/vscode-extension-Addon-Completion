import * as data from "./data.json";


export class BuildData{
    variable!: Array<VariableData>;
    completion!: Array<VariablePath>;

    static instance = <BuildData>data;
}

export class VariableData{
    name!: string;
    from!: Array<VariablePath>;
}

export class VariablePath{
    jsonPattern!: RegExp[];
    jsonPath!: string;
    path!:string;
    use!:string;
}