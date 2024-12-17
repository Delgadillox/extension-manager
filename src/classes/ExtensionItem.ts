import * as vscode from 'vscode';
import * as path from 'path';
export class ExtensionItem extends vscode.TreeItem {
	needsUpdate?: boolean;
	newVersion?: string;

	constructor(
		public readonly label: string,
		public readonly version: string,
		public readonly id: string,
		public readonly fileId: number,
		public readonly file_name: string,
		public readonly fileUri?: vscode.Uri,
		public readonly projectId?: string,
		public readonly logoPath?: vscode.Uri
	) {
		super(label, vscode.TreeItemCollapsibleState.None);

		this.tooltip = `${this.label} - ${this.version}`;
		this.description = version;
		this.contextValue = 'extensionItem';
		const iconFileName = 'gitlab-logo-500.svg';
		const iconPath = path.join(__filename, '..', '..', 'assets', iconFileName);

		this.iconPath = logoPath || vscode.Uri.file(iconPath);
	}
}
