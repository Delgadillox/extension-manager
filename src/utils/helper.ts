import axios from 'axios';
import * as vscode from 'vscode';
import { ExtensionItem } from '../classes/ExtensionItem';

export async function getExtensions(
  context: vscode.ExtensionContext,
  token: string,
  gitlabHost: string,
  projectId: string
) {
  const url = `https://${gitlabHost}/api/v4/projects/${projectId}/packages`;

	try {
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		// Map each package to fetch its details
		const packageRequests = response.data.map(async (pkg: any) => {
			const packageUrl = `https://${gitlabHost}/api/v4/projects/${projectId}/packages/${pkg.id}`;
			try {
				const pkgResponse = await axios.get(packageUrl, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				const packageInfo = pkgResponse.data;
				const filesUrl = `https://${gitlabHost}/api/v4/projects/${projectId}/packages/${pkg.id}/package_files`;

				const filesResponse = await axios.get(filesUrl, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (
					filesResponse.data.length === 0 ||
					!filesResponse.data[0].file_name.endsWith('.vsix')
				) {
					console.warn(`No files found for package ${pkg.id}`);
					return null;
				}

				const file = filesResponse.data[0];
				const fileUri = `https://${gitlabHost}/api/v4/projects/${projectId}/packages/${pkg.id}/package_files/${file.id}/download`;
				const fileName = file?.file_name || 'unknown';
				const extensionItem = new ExtensionItem(
					packageInfo.name,
					packageInfo.version,
					packageInfo.id,
					file?.id || 0,
					fileName,
					vscode.Uri.parse(fileUri)
				);

				return extensionItem;
			} catch (pkgError) {
				console.error(`Failed to fetch package ${pkg.id}`, pkgError);
				return null;
			}
		});

		// Flatten the results and filter out nulls
		const allItems = (await Promise.all(packageRequests)).filter(
			(item): item is ExtensionItem => item !== null
		);

		// Save to global state
		await context.globalState.update('allExtensions', allItems);
	} catch (error) {
		console.error('Extensions. Failed to fetch packages:', error);
		vscode.window.showErrorMessage('Failed to fetch data.');
	}
}

export async function getInstalledExtensions(context: vscode.ExtensionContext) {
	try {
		const allExtensions =
			context.globalState.get<ExtensionItem[]>('allExtensions');

		const installedExtensions = vscode.extensions.all
			.map((ext) => ({
				id: ext.id.split('.')[1],
				version: ext.packageJSON.version,
			}))
			.reduce((map, ext) => {
				map.set(ext.id, ext.version);
				return map;
			}, new Map<string, string>());

		const matchedExtensions = allExtensions
			.filter((item) => {
				const installedVersion = installedExtensions.get(item.label);
				return installedVersion && installedVersion === item.version;
			})
			.map(
				(item) =>
					new ExtensionItem(
						item.label,
						item.version,
						item.id,
						item.fileId,
						item.file_name,
						item.fileUri
					)
			);

		console.log('installed', matchedExtensions);
		await context.globalState.update('installedExtensions', matchedExtensions);
	} catch (error) {
		console.error('Helper. Failed to get installed packages:', error);
		vscode.window.showErrorMessage('Failed to get installed extensions.');
	}
}

export async function getMarketplaceExtensions(
	context: vscode.ExtensionContext
) {
	try {
		const allExtensions =
			context.globalState.get<ExtensionItem[]>('allExtensions');

		const installedExtensions = context.globalState.get<ExtensionItem[]>(
			'installedExtensions'
		);

		const marketplaceExtensions = allExtensions
			.filter(
				(item) =>
					!installedExtensions.some(
						(installed) =>
							installed.label === item.label &&
							installed.version === item.version
					)
			)
			.map(
				(item) =>
					new ExtensionItem(
						item.label,
						item.version,
						item.id,
						item.fileId,
						item.file_name,
						item.fileUri
					)
			);

		console.log('marketplace', marketplaceExtensions);

		context.globalState.update('marketplaceExtensions', marketplaceExtensions);
	} catch (error) {
		console.error('Helper. Failed to get installed packages:', error);
		vscode.window.showErrorMessage('Failed to get installed extensions.');
	}
}

export async function checkUpdates(context: vscode.ExtensionContext) {
	const needUpdate = [];
	const installedExtensions = context.globalState.get<ExtensionItem[]>(
		'installedExtensions'
	);
	if (installedExtensions.length > 0) {
		const allExtensions =
			context.globalState.get<ExtensionItem[]>('allExtensions');

		installedExtensions.forEach((item1) => {
			const match = allExtensions.find(
				(item2) =>
					item1.label === item2.label && item1.version !== item2.version
			);
			if (match) {
				needUpdate.push({
					name: item1.label,
					version1: item1.version,
					version2: match.version,
				});
			}
		});
	}
	return needUpdate;
}

export async function getChanges(context: vscode.ExtensionContext) {
	await getInstalledExtensions(context);
	await getMarketplaceExtensions(context);
}
