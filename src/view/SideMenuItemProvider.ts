import { Command, Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from "vscode";
import FileHandle from '../util/FileHandle';

export class MenuEntryItem extends TreeItem {
}
export class SideMenuItemProvider implements TreeDataProvider<MenuEntryItem> {
    data: MenuEntryItem[] = [];
    constructor(data: MenuEntryItem[]) {
        this.setData(data);
    }

    setData(data: MenuEntryItem[]) {
        this.data = data;
    }

    getTreeItem(element: MenuEntryItem): TreeItem | Thenable<TreeItem> {
        return element;
    }
    getChildren(element?: MenuEntryItem | undefined): ProviderResult<MenuEntryItem[]> {
        if (element) {
            
            return this.data;
        } else {
            return [new MenuEntryItem("root", TreeItemCollapsibleState.Collapsed)];
        }
    }
    private _onDidChangeTreeData: EventEmitter<MenuEntryItem | undefined | null | void> = new EventEmitter<MenuEntryItem | undefined | null | void>();
    readonly onDidChangeTreeData: Event<MenuEntryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

}