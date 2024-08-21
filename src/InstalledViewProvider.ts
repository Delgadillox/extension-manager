import * as vscode from 'vscode';
import { ExtensionItem } from './classes/ExtensionItem';
import { checkUpdates } from './utils/helper';

export class InstalledViewProvider
	implements vscode.TreeDataProvider<ExtensionItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<
		ExtensionItem | undefined | null | void
	> = new vscode.EventEmitter<ExtensionItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<
		ExtensionItem | undefined | null | void
	> = this._onDidChangeTreeData.event;

	private installedExtensions: ExtensionItem[] = [];

	constructor(private context: vscode.ExtensionContext) {
		this.initialize();
	}

	private initialize() {
		// Load installed extensions directly from global state
		this.installedExtensions = this.context.globalState.get<ExtensionItem[]>(
			'installedExtensions',
			[]
		);

		this._onDidChangeTreeData.fire();
	}

	public refreshInstalledExtensions() {
		this.initialize();
	}

	getTreeItem(element: ExtensionItem): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(
			element.label,
			vscode.TreeItemCollapsibleState.None
		);
		treeItem.description = `v${element.version}`;

		if (element.needsUpdate) {
			treeItem.contextValue = 'needsUpdate';
			treeItem.tooltip = `New version available: v${element.newVersion}`;
			treeItem.command = {
				command: 'extensionManager.updateExtension',
				title: 'Update Extension',
				arguments: [element],
			};
		}

		return treeItem;
	}

	async getChildren(element?: ExtensionItem): Promise<ExtensionItem[]> {
		if (element) {
			return [];
		}

		const installedExtensions =
			this.context.globalState.get<ExtensionItem[]>('installedExtensions') ||
			[];

		const needUpdate = await checkUpdates(this.context);

		const updatedExtensions = installedExtensions.map((ext) => {
			const updateInfo = needUpdate.find(
				(update) => update.label === ext.label
			);
			if (updateInfo) {
				ext.needsUpdate = true;
				ext.newVersion = updateInfo.version2;
			} else {
				ext.needsUpdate = false;
			}
			return ext;
		});

		return updatedExtensions;
	}

	async uninstallExtension(extensionItem: ExtensionItem) {
		const confirmed = await vscode.window.showWarningMessage(
			`Are you sure you want to uninstall the extension ${extensionItem.label}?`,
			{ modal: true },
			'Yes'
		);

		if (confirmed === 'Yes') {
			const extensionToDelete = vscode.extensions.all.find(
				(item) => item.packageJSON.name === extensionItem.label
			);
			console.log(extensionItem, extensionToDelete);
			await vscode.commands.executeCommand(
				'workbench.extensions.uninstallExtension',
				extensionToDelete.id
			);
			vscode.window.showInformationMessage(
				`Extension ${extensionItem.label} uninstalled successfully.`
			);
			this.refreshInstalledExtensions();
		}
	}
}
