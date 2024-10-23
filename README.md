# extension-manager

The "extension-manager" extension for Visual Studio Code allows you to easily manage and install extensions directly from a GitLab repository. With a user-friendly interface, you can view available extensions, install them, and manage installed ones seamlessly.

## Features

- **Marketplace View**: Browse and install extensions from a GitLab repository.
- **Installed View**: View and manage installed extensions, including uninstalling them with confirmation prompts.
- **Global Configuration**: Set up your GitLab token, GitlabHost (optional), project ID, and other settings.

## Requirements

- A GitLab account with access to the repository containing the `.vsix` files.
- The repository must be configured to store and serve `.vsix` files via the GitLab Package Registry.

## Extension Settings

This extension contributes the following settings:

- `extensionManager.token`: GitLab personal access token.
- `extensionManager.projectId`: GitLab project ID.
- `extension-manager.gitlabHost`: (Optional) gitlab host. (defaults to gitlab.com)

## Known Issues

- **Update Functionality**: The extension currently does not support automatic updates for installed extensions. This feature is planned for a future release.

## Release Notes

### 1.0.0

- Initial release of the "extension-manager".
- Basic features include viewing, installing, and uninstalling extensions.

---

**Enjoy!**
