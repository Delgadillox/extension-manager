import * as vscode from 'vscode';

export class ExtensionItem extends vscode.TreeItem {
	needsUpdate?: boolean;
	newVersion?: string;
	constructor(
		public readonly label: string,
		public readonly version: string,
		public readonly id: string,
		public readonly fileId: number,
		public readonly file_name: string,
		public readonly fileUri?: vscode.Uri
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = `${this.label} - ${this.version}`;
		this.description = version;
		this.contextValue = 'extensionItem';
	}
}
