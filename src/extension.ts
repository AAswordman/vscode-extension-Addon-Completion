
import * as vscode from 'vscode';
import {
	Uri
} from 'vscode';
import FileHandle from './util/FileHandle';
import { workspace, TreeItemCollapsibleState } from 'vscode';
import Global from './Global';
import { SideSimpleList } from './view/SideSimpleList';
import { SideMenuItemProvider, MenuEntryItem } from './view/SideMenuItemProvider';
import { build, getCompletionSource } from './lib/ProgramProcess';
import ItemProvider from './view/ItemProvider';

let behListProvider = new SideSimpleList("beh");
let resListProvider = new SideSimpleList("res");


async function reloadWorkspace() {
	if (workspace.workspaceFolders !== null) {
		Global.cacheDir = FileHandle.fromUri((<vscode.WorkspaceFolder[]>workspace.workspaceFolders)[0].uri).enter(".AddCompLib");
	}
	Global.cacheDir.mkdirs();
	let file = Global.cacheDir.child("global.json");
	if (await file.exists()) {
		let obj: Global = eval("(" + await file.read() + ")");
		Global.instance = obj;
		console.log("old", Global.instance);
	} else {
		Global.instance = new Global();
		console.log("new", Global.instance);
	}
	updateSideList();
}

function saveGlobalData() {
	console.log("save", Global.instance);
	Global.cacheDir.child("global.json").write(JSON.stringify(Global.instance));
}

function updateSideList() {
	behListProvider.setData(Global.instance.behSimpleFiles);
	resListProvider.setData(Global.instance.resSimpleFiles);

	behListProvider.refresh();
	resListProvider.refresh();
}

export function activate(context: vscode.ExtensionContext) {
	console.log("vscode extensions");
	reloadWorkspace().then(res => {
		saveGlobalData();

		context.subscriptions.push(vscode.window.registerTreeDataProvider("addon-completion-beh-simple", behListProvider));
		context.subscriptions.push(vscode.window.registerTreeDataProvider("addon-completion-res-simple", resListProvider));

		context.subscriptions.push(vscode.window.registerTreeDataProvider("addon-setting", new SideMenuItemProvider([
			{
				"label": "build",
				"collapsibleState": TreeItemCollapsibleState.None,
				"command": {
					"command": "bedrock-addon-completion.buildLib",
					"title": "bedrock"
				}

			},
			{
				"label": "start",
				"collapsibleState": TreeItemCollapsibleState.None,
				"command": {
					"command": "bedrock-addon-completion.startLib",
					"title": "bedrock"
				}

			},
			{
				"label": "finish",
				"collapsibleState": TreeItemCollapsibleState.None,
				"command": {
					"command": "bedrock-addon-completion.finishLib",
					"title": "bedrock"
				}

			}
		])));
	});

	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('json', new ItemProvider(), ..."qwertyuiopasdfghjklzxcvbnm.:1234567890\":".split('')));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('jsonc', new ItemProvider(), ..."qwertyuiopasdfghjklzxcvbnm.:1234567890\":".split('')));

	context.subscriptions.push(vscode.commands.registerCommand("bedrock-addon-completion.addBehSimple", () => {
		let path: string = Global.instance.behSimpleFiles[0] || "D://";
		vscode.window.showOpenDialog({ // 可选对象
			canSelectFiles: false, // 是否可选文件
			canSelectFolders: true, // 是否可选文件夹
			canSelectMany: true, // 是否可以选择多个
			defaultUri: vscode.Uri.file(path), // 默认打开本地路径
			openLabel: '添加为样本'
		}).then((msg) => {
			if (msg !== null) {
				(<Uri[]>msg).forEach((u) => {
					Global.instance.behSimpleFiles.push(u.path);
				});
				console.log("Build beh complete");
				saveGlobalData();
				updateSideList();
			}
		});
	}));
	context.subscriptions.push(vscode.commands.registerCommand("bedrock-addon-completion.addResSimple", () => {
		let path: string = Global.instance.resSimpleFiles[0] || "D://";
		vscode.window.showOpenDialog({ // 可选对象
			canSelectFiles: false, // 是否可选文件
			canSelectFolders: true, // 是否可选文件夹
			canSelectMany: true, // 是否可以选择多个
			defaultUri: vscode.Uri.file(path), // 默认打开本地路径
			openLabel: '添加为样本'
		}).then((msg) => {
			if (msg !== null) {
				(<Uri[]>msg).forEach((u) => {
					Global.instance.resSimpleFiles.push(u.path);
				});
				console.log("Build res complete");
				saveGlobalData();
				updateSideList();
			}
		});
	}));


	context.subscriptions.push(vscode.commands.registerCommand("bedrock-addon-completion.simpleClick",
		(id: string, type: string, msg: string) => {
			switch (id) {
				case "simpleClick": {
					if (type === "beh") {
						vscode.window.showInformationMessage("simple file path: " + msg, 'delete', 'ok')
							.then(function (select) {
								if (select === "delete") {
									Global.instance.behSimpleFiles.splice(Global.instance.behSimpleFiles.indexOf(msg, 1));
									behListProvider.refresh();
								}
							});
					} else if (type === "res") {
						vscode.window.showInformationMessage("simple file path: " + msg, 'delete', 'ok')
							.then(function (select) {
								if (select === "delete") {
									Global.instance.resSimpleFiles.splice(Global.instance.resSimpleFiles.indexOf(msg, 1));
									resListProvider.refresh();
								}
							});
					}
				}
			}
		}));
	context.subscriptions.push(vscode.commands.registerCommand("bedrock-addon-completion.buildLib",
		() => {
			console.log("Building addon");
			vscode.window.showInformationMessage("正在构建补全库", "ok");
			build();
			vscode.window.showInformationMessage("构建完毕", "ok");
			saveGlobalData();

		}));
	context.subscriptions.push(vscode.commands.registerCommand("bedrock-addon-completion.startLib",
		() => {
			if (!Global.instance.inProgram) {
				console.log("start addon");
				Global.instance.inProgram = true;
				vscode.window.showInformationMessage("补全开启", "ok");
				saveGlobalData();

			}
		}));
	context.subscriptions.push(vscode.commands.registerCommand("bedrock-addon-completion.finishLib",
		() => {
			if (Global.instance.inProgram) {
				console.log("finish addon");
				Global.instance.inProgram = false;
				vscode.window.showInformationMessage("补全关闭", "ok");
				saveGlobalData();
			}
		}));
};