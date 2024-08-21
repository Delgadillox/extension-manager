import * as vscode from 'vscode';
import { MarketplaceViewProvider } from './MarketplaceViewProvider';
import { InstalledViewProvider } from './InstalledViewProvider';
import { ExtensionItem } from './classes/ExtensionItem';
import {
	getExtensions,
	getInstalledExtensions,
	getMarketplaceExtensions,
	getChanges,
} from './utils/helper';

export async function activate(context: vscode.ExtensionContext) {
	console.log(
		'Congratulations, your extension "extension-manager" is now active!'
	);

	const token = vscode.workspace
		.getConfiguration()
		.get<string>('extension-manager.token');
	const projectId = vscode.workspace
		.getConfiguration()
		.get<string>('extension-manager.projectId');

	if (!token || !projectId) {
		vscode.window.showErrorMessage('Project ID or token is missing.');
		return;
	}

	await getExtensions(context, token, projectId);
	await getInstalledExtensions(context);
	await getMarketplaceExtensions(context);

	const marketplaceProvider = new MarketplaceViewProvider(
		context,
		token,
		projectId
	);

	// Set up the "Marketplace" view
	vscode.window
		.createTreeView('extension-marketplace', {
			treeDataProvider: marketplaceProvider,
			showCollapseAll: true,
		})
		.onDidChangeSelection((event) => {
			if (event.selection.length === 1) {
				const selectedItem = event.selection[0] as ExtensionItem;
				if (selectedItem instanceof ExtensionItem) {
					marketplaceProvider.installVsix(selectedItem);
				}
			}
		});

	// Set up the "Installed" view after marketplace has initialized
	const installedProvider = new InstalledViewProvider(context);

	vscode.window
		.createTreeView('extension-installed', {
			treeDataProvider: installedProvider,
			showCollapseAll: true,
		})
		.onDidChangeSelection((event) => {
			if (event.selection.length === 1) {
				const selectedItem = event.selection[0] as ExtensionItem;
				if (selectedItem instanceof ExtensionItem) {
					installedProvider.uninstallExtension(selectedItem);
				}
			}
		});

	//workspace.onDidChangeConfiguration
	// Handle when extensions change (for example, uninstall)
	let lastExtensions = new Set(vscode.extensions.all.map((ext) => ext.id));
	setInterval(async () => {
		const currentExtensions = new Set(
			vscode.extensions.all.map((ext) => ext.id)
		);
		if (
			currentExtensions.size !== lastExtensions.size ||
			[...currentExtensions].some((id) => !lastExtensions.has(id))
		) {
			console.log('Extensions changed');
			await getChanges(context);
			installedProvider.refreshInstalledExtensions(); // Refresh Installed view
			marketplaceProvider.refreshMarketplace(); // Refresh Marketplace view
			lastExtensions = currentExtensions;
		}
	}, 10000);
}

export function deactivate() {}
