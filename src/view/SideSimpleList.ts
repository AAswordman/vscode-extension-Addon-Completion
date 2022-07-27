import { Command, Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from "vscode";
import FileHandle from '../util/FileHandle';

export class EntryItem extends TreeItem {


}
export class SideSimpleList implements TreeDataProvider<EntryItem> {
    data: string[] = [];
    items: EntryItem[] = [];
    type: string;
    constructor(type:string) {
        this.type = type;
    }


    setData(data: string[]) {
        this.data = data;
    }

    getTreeItem(element: EntryItem): TreeItem | Thenable<TreeItem> {
        return element;
    }
    getChildren(element?: EntryItem | undefined): ProviderResult<EntryItem[]> {
        if (element) {
            this.items = [];
            if (this.data === null) { return []; }
            for (let i of this.data) {
                let item = new EntryItem(i, TreeItemCollapsibleState.None);
                item.command = {
                    "command": "bedrock-addon-completion.simpleClick",
                    "title": i,
                    "arguments":["simpleClick",this.type,i]
                };
                this.items.push(item);

            }
            return this.items;
        } else {
            return [new EntryItem("root", TreeItemCollapsibleState.Collapsed)];
        }
    }
    private _onDidChangeTreeData: EventEmitter<EntryItem | undefined | null | void> = new EventEmitter<EntryItem | undefined | null | void>();
    readonly onDidChangeTreeData: Event<EntryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

}