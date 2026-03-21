---
title: "Windows Integration"
description: "File association and icon registration for .sdf files on Windows."
sidebar:
  label: "Windows"
  order: 3
---

The Windows integration registers the `.sdf` file extension with the Windows Registry, giving you:

- The Etapsky SDF icon in File Explorer
- Correct file type description ("Smart Document Format")
- "Open with SDF CLI" context menu entry (if `sdf-cli` is installed)

## Installation

Open **PowerShell as Administrator** and run:

```powershell
.\tooling\os-integration\windows\register-sdf.ps1
```

Or, if you have cloned the repository:

```powershell
git clone https://github.com/etapsky/sdf.git
cd sdf\tooling\os-integration\windows
.\register-sdf.ps1
```

The script writes the following registry keys under `HKEY_CLASSES_ROOT`:

```
HKCR\.sdf                      → ProgID: EtapskySDF.Document
HKCR\EtapskySDF.Document       → "Smart Document Format"
HKCR\EtapskySDF.Document\DefaultIcon
HKCR\EtapskySDF.Document\shell\open\command
```

## Requirements

- Windows 10 or Windows 11
- PowerShell 5.1 or later (included with Windows)
- Administrator privileges (required to write to `HKEY_CLASSES_ROOT`)

## Verifying the installation

1. Open File Explorer and navigate to any `.sdf` file.
2. The file should display the Etapsky SDF icon and show "Smart Document Format" as the file type.
3. Right-click the file — if `sdf-cli` is installed and on `PATH`, an **Open with SDF CLI** option appears.

After running the script, restart File Explorer if the icon does not update immediately:

```powershell
Stop-Process -Name explorer -Force; Start-Process explorer
```

## Uninstallation

Open **PowerShell as Administrator** and run:

```powershell
.\tooling\os-integration\windows\unregister-sdf.ps1
```

This removes all `.sdf` registry entries and reverts the file association to the Windows default (unknown file type).

## What is not included

The Windows integration does not include a Quick Look-style preview panel. For inline document preview on Windows, use the [VS Code extension](/sdf/tooling/vscode) with the `SDF: Preview PDF` command.
