# Upstream provenance

Zingpop is an independent downstream adaptation of [OpenCode](https://github.com/anomalyco/opencode).

## Recorded baseline

- Upstream project: `anomalyco/opencode`
- Upstream revision recorded by the import commit: `9f1f0b4`
- Zingpop import commit: `ef38900`
- Import commit message: `Initial snapshot from open复现 (9f1f0b4)`
- Upstream license: MIT

The repository was imported as a snapshot instead of being created through GitHub's fork button. GitHub therefore does not display the usual fork badge, but that UI detail does not change the provenance stated here.

## Ownership boundary

OpenCode maintainers and contributors own the inherited agent runtime, terminal interface, SDKs, provider integrations, and other code present in the recorded baseline.

The Zingpop downstream work after that baseline includes:

- Beginner-oriented visual prompt workshop and product templates.
- Hosted project/workspace flow and local-folder synchronization.
- User-readable agent progress narrative and preview readiness.
- China-oriented authentication and payment adaptations.
- Zingpop operator console and admin backend.
- Electron desktop packaging and Windows release verification.
- Production deployment, isolation, backup, health, and UX verification assets.
- Product specifications, tests, localization, and launch-readiness work.

Use `git diff ef38900..HEAD` to inspect the exact downstream delta and `git log ef38900..HEAD` to review its history.

## Synchronization policy

Upstream synchronization is manual. Future imports should preserve upstream authorship and license notices, record the upstream revision, and resolve Zingpop-specific behavior through review and tests. Zingpop metrics must not reuse OpenCode's downloads, contributors, stars, or community activity as its own.

## License

The inherited and downstream code is distributed under the repository's [MIT License](LICENSE). This document supplements rather than replaces copyright notices already present in source files and history.
