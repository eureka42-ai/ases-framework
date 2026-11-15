# Eureka42 ASES for Visual Studio Code

The extension adds **Eureka42 → ASES: Start Project** to the Command Palette. Open a project folder, run the command, and ASES opens the integrated terminal in that folder. It prints the green Eureka42 logo and then starts the existing CLI interview for application type, language, hosting, database, scale and sensitive data.

## Prerequisites

- Visual Studio Code 1.85 or later.
- The ASES CLI installed and available as `ases` on the integrated terminal's `PATH`.

The extension does not install the CLI, make network requests, or write project files by itself. The CLI interview retains its normal proposal/review and explicit-resume behavior.

## Install locally

From the repository root, package the extension and install the generated VSIX:

```sh
cd integrations/vscode
npm install --global @vscode/vsce
vsce package
code --install-extension eureka42-ases-0.1.0-rc.1.vsix
```

The extension source and icon are also included in the ASES CLI package under `dist/integrations/vscode/`.
