# Zingpop Open-Source Notices

Last updated: 2026-05-28

Zingpop includes open-source software and keeps the original license notices where required. This page is the operator-facing notice file; the public user-facing summary is published at `/legal/open-source-notices`.

## Relationship To opencode

Zingpop is not the official opencode service. Zingpop uses open-source software and adds Zingpop-specific product, authentication, deployment, billing, compliance, and domestic workflow layers. References to opencode are retained only for license attribution, technical compatibility, package names, or source-code provenance.

The original MIT license and copyright notices must remain in the repository. Do not remove the root `LICENSE`, dependency notices, or copyright headers that come from upstream projects.

## License Audit

Run a license audit before every production upload:

```bash
bun scripts/license-audit.mjs --repo .
```

The audit checks direct production dependencies that are present in `node_modules` and flags high-risk licenses such as GPL, AGPL, SSPL, proprietary, unlicensed, and similar restricted terms. It is not a substitute for legal review, but it prevents the common launch mistake of shipping a dependency without noticing a strong copyleft or proprietary restriction.

## Reviewed License Overrides

Some packages used by the production build can ship installed package metadata without a local `license` field. These reviews keep the audit deterministic while preserving a visible source trail for legal review.

- `@openauthjs/openauth`: installed package metadata can omit a local license field. The upstream repository is published with an MIT license: https://github.com/sst/openauth
- `@solidjs/start`: installed prerelease/pkg-pr metadata can omit a local license field. The npm package declares MIT: https://www.npmjs.com/package/@solidjs/start

If either package source, package name, or resolved version changes, rerun `bun scripts/license-audit.mjs --repo .` and re-review the exact deployed artifact.

## Manual Review Checklist

- Keep the MIT license and original upstream attribution.
- Review GPL, LGPL, AGPL, SSPL, BUSL, Elastic, PolyForm, proprietary, font, icon, image, SDK, and model-provider restrictions.
- Review generated assets, screenshots, icons, fonts, and marketing copy for commercial usage rights.
- Keep Zingpop user-facing branding distinct from opencode unless attribution is required.
- Keep payment, SMS, cloud, model-provider, and analytics terms in the third-party processor disclosure.

## User-Facing Brand Boundary

User-facing screens should use Zingpop naming for the hosted service. Use opencode only when it is needed for source attribution, package names, compatibility, or developer documentation. Avoid copy that implies Zingpop is operated, endorsed, or supported by the original opencode maintainers.
