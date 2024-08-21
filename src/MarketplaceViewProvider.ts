import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ExtensionItem } from './classes/ExtensionItem';

export class MarketplaceViewProvider
	implements vscode.TreeDataProvider<ExtensionItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<
		ExtensionItem | undefined | null | void
	> = new vscode.EventEmitter<ExtensionItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<
		ExtensionItem | undefined | null | void
	> = this._onDidChangeTreeData.event;

	private _onDidInstallExtension = new vscode.EventEmitter<ExtensionItem>();
	readonly onDidInstallExtension: vscode.Event<ExtensionItem> =
		this._onDidInstallExtension.event;

	private marketplaceExtensions: ExtensionItem[] = [];

	constructor(
		private context: vscode.ExtensionContext,
		private token: string,
		private projectId: string
	) {
		this.initialize();
	}

	private initialize() {
		// Load marketplace extensions directly from global state
		this.marketplaceExtensions = this.context.globalState.get<ExtensionItem[]>(
			'marketplaceExtensions',
			[]
		);
		this._onDidChangeTreeData.fire();
	}

	public refreshMarketplace() {
		this.initialize();
	}

	getTreeItem(element: ExtensionItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ExtensionItem): Thenable<ExtensionItem[]> {
		return Promise.resolve(this.marketplaceExtensions);
	}

	installVsix(extensionItem: ExtensionItem) {
		const vsixUrl = `https://gitlab.com/api/v4/projects/${this.projectId}/packages/generic/${extensionItem.label}/${extensionItem.version}/${extensionItem.file_name}`;

		axios({
			url: vsixUrl,
			method: 'GET',
			responseType: 'arraybuffer',
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		})
			.then((response) => {
				if (this.context.globalStorageUri) {
					const globalStoragePath = new URL(
						this.context.globalStorageUri.toString()
					).pathname;
					const tempDir = path.join(globalStoragePath, 'vsix');
					if (!fs.existsSync(tempDir)) {
						fs.mkdirSync(tempDir, { recursive: true });
					}

					const tempPath = path.join(tempDir, extensionItem.file_name);
					fs.writeFileSync(tempPath, response.data);

					vscode.commands
						.executeCommand(
							'workbench.extensions.installExtension',
							vscode.Uri.file(tempPath)
						)
						.then(() => {
							vscode.window.showInformationMessage(
								`Extension ${extensionItem.label} installed successfully!`
							);
						});
				} else {
					vscode.window.showErrorMessage('Global storage path is not defined.');
				}
			})
			.catch((error) => {
				console.error('Failed to download and install the extension:', error);
				vscode.window.showErrorMessage(
					'Failed to download and install the extension.'
				);
			});
	}
}
