---
title: "Open Source"
description: "Etapsky's open source commitment — BUSL-1.1 source-available license converting to Apache 2.0 in 2030."
sidebar:
  label: "Open Source"
  order: 3
---

Etapsky publishes all core libraries and the format specification as source-available code. This page explains what that means in practice, what license applies to each component, and how to contribute.

## License Summary

| Component | License | Notes |
|-----------|---------|-------|
| SDF format spec (`spec/SDF_FORMAT.md`) | CC-BY 4.0 | Free to implement, reference, and extend |
| All code packages | BUSL-1.1 | Converts to Apache-2.0 on 2030-03-17 |

## Business Source License 1.1 (BUSL-1.1)

All Etapsky code — including `@etapsky/sdf-kit`, `@etapsky/sdf-cli`, `@etapsky/sdf-schema-registry`, `@etapsky/sdf-server-core`, `@etapsky/cloud-sdk`, and `etapsky-sdf` — is licensed under the **Business Source License 1.1**.

BUSL-1.1 is a source-available license with a time-limited commercial restriction. Here is what it means for you:

**What you can do without restriction:**
- Read the source code
- Fork the repository
- Use the software in development, testing, and non-production environments
- Build integrations and evaluate the software for commercial use
- Contribute pull requests

**What requires a commercial license before the change date:**
- Running the software in a production environment for commercial purposes

**What happens on 2030-03-17:**
- The license converts automatically to **Apache-2.0** for all code released under BUSL-1.1
- No action required on your part — the code becomes fully open at that point

:::note
The change date is baked into the license header of every published file. You can verify the conversion terms in the `LICENSE` file at the root of [github.com/etapsky/sdf](https://github.com/etapsky/sdf).
:::

### Change Date: 2030-03-17

| Field | Value |
|-------|-------|
| License | Business Source License 1.1 |
| Licensor | Etapsky Inc. |
| Change Date | 2030-03-17 |
| Change License | Apache License 2.0 |

For commercial licensing before the change date, contact hello@etapsky.com.

## Format Specification — CC-BY 4.0

The SDF format specification (`spec/SDF_FORMAT.md`) is licensed separately under **Creative Commons Attribution 4.0 International (CC-BY 4.0)**.

This means anyone can:
- Implement SDF in any language or platform
- Reference the specification in their own documentation
- Fork and extend the specification (with attribution)
- Build products based on SDF without a commercial license

The goal is to allow the SDF format to spread freely as an interoperability standard, independent of any single implementation.

## Repositories

| Repository | URL | Description |
|------------|-----|-------------|
| Main monorepo | [github.com/etapsky/sdf](https://github.com/etapsky/sdf) | SDK, CLI, server, spec |
| SaaS platform | [github.com/etapsky/sdf-cloud](https://github.com/etapsky/sdf-cloud) | api.etapsky.com infrastructure |

## Contributing

Contributions are welcome. The process:

1. Open an issue before starting significant work — this prevents duplicate effort and ensures alignment with the roadmap.
2. Fork the repository and create a branch from `main`.
3. Follow the existing code style. The project uses TypeScript strict mode — `any` is not permitted.
4. Add tests. The coverage gate is 80% minimum.
5. Submit a pull request. A maintainer will review within a reasonable timeframe.

**Before contributing**, read the contribution guidelines in `CONTRIBUTING.md` at the root of the repository.

:::tip
Bug reports and feature requests are contributions too. A well-written issue that clearly describes a problem or use case is often more valuable than a pull request with a partial solution.
:::

### Code Style

- Language: TypeScript 5.7+ with strict mode
- Formatter: Prettier (config at repo root)
- Linter: ESLint (config at repo root)
- Package manager: Bun — use `bun install`, not `npm install`
- Test runner: Vitest

### What We Accept

- Bug fixes with regression tests
- Documentation improvements
- New language bindings (coordinate first — we want to ensure format compliance)
- Schema examples for new document types
- Integration guides

### What We Do Not Accept Without Prior Discussion

- New dependencies that conflict with the technology stack decisions in `CLAUDE.md`
- Changes to the format specification (`spec/SDF_FORMAT.md`) — spec changes require a separate discussion process
- Breaking changes to public APIs without a deprecation path
