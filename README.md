# Config Defaults

Initializes `settings.json` and other `.vscode` config files from defaults files.

Upon opening a workspace, this extension will look for any files under the
`.vscode` directory named `[filename].default.[ext]` and copy them to
`[filename].[ext]` unless they already exist.

This allows you to check Visual Studio Code configuration files into source
control while still allowing developers to customize their settings. For
example, if you check in `.vscode/settings.default.json` and
`.vscode/tasks.default.json` files, then `settings.json` and `tasks.json` will
be created upon opening the project for the first time. If these files already
exist, they will be left unmodified.

## Resetting Configuration

To reset a config file to its defaults, delete the file and run the
`Config Defaults: Initialize Config Files` command.

## Recommended Project Setup

For any `.vscode` config file you want to check into source control, but which
developers should be able to customize, add `.default` before the file extension.
For example, `.vscode/settings.json` becomes `.vscode/settings.default.json`.

Add the `.vscode` directory to your ignore file, then add exceptions for
`.default` files and any files developers should not customize. For example, a
`.gitignore` might include this:

```
.vscode/*
!.vscode/**/*.default.*
!.vscode/extensions.json
```

Create a `.vscode/extensions.json` file which recommends to use this extension
with the project:

```json
{
	"recommendations": [
		"spadin.config-defaults"
	]
}
```
