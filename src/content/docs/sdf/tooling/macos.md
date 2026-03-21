---
title: "macOS Integration"
description: "Quick Look preview and Finder icon registration for .sdf files on macOS."
sidebar:
  label: "macOS"
  order: 2
---

The macOS integration registers the `.sdf` file type with the operating system, giving you:

- The Etapsky SDF icon in Finder (8 sizes from 16 × 16 px to 1024 × 1024 px, including Retina variants)
- Quick Look preview with Space bar — shows the visual PDF layer inline
- Correct MIME type association

## Installation

Run the one-line installer:

```bash
curl -fsSL https://raw.githubusercontent.com/etapsky/sdf/main/tooling/os-integration/macos/install-macos.sh | bash
```

The script:

1. Copies the Quick Look plugin to `~/Library/QuickLook/`
2. Registers the `.sdf` UTI (Uniform Type Identifier) with Launch Services
3. Copies the SDF icon set to the correct system locations
4. Runs `qlmanage -r` to reload Quick Look

**No elevated privileges are required.** The installer operates entirely in your home directory.

## Requirements

- macOS 12 Monterey or later
- Xcode Command Line Tools (for `qlmanage`)

## Verifying the installation

1. Open Finder and navigate to any `.sdf` file.
2. The file should display the Etapsky SDF icon.
3. Press Space bar — the Quick Look preview should open and show the visual PDF layer.

If the icon does not appear immediately, log out and back in or run:

```bash
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user
```

## Uninstallation

```bash
cd tooling/os-integration/macos && bash register-icon.sh --uninstall
```

This removes the Quick Look plugin and icon registration. Finder icon associations revert to the default blank document icon.

## Manual installation

If you prefer not to run the curl installer, clone the repository and run the script directly:

```bash
git clone https://github.com/etapsky/sdf.git
cd sdf/tooling/os-integration/macos
bash install-macos.sh
```
