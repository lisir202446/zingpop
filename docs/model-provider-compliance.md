# Model Provider Compliance Review

Last updated: 2026-05-28

This document is the required signoff record before Zingpop is offered as a paid public service. It is not legal advice; final conclusions must be confirmed against the exact provider account, contract, region, and model list used in production.

## Default Customer Data Commitments

- Zingpop must not use private customer code, prompts, project files, terminal output, model output, or uploaded files to train Zingpop models unless the customer explicitly opts in.
- Zingpop should send user content to third-party model providers only to provide the requested AI function, abuse prevention, billing, and service reliability.
- Zingpop must disclose third-party model processing in the public privacy policy, data-processing notice, and third-party disclosure page.
- Any provider or route that sends personal information, code, prompts, or model outputs outside mainland China needs a separate legal review before being enabled for paid users.
- Provider API keys must be least-privilege, server-side only, rotated before paid launch, and excluded from Git, logs, screenshots, issues, and support messages.

## Provider Review Checklist

For each model provider enabled in production, attach evidence for every row.

| Provider | Production models | Commercial use allowed | Input/output retention | Training use policy | Processing region/cross-border | Abuse/safety terms | Rate/quota limits | Status | Evidence owner/date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DeepSeek or current default provider | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Blocked until reviewed | TBD |
| OpenAI-compatible provider | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Blocked until reviewed | TBD |
| Customer-supplied provider key | User configured | Must be covered by user/provider terms | Provider-specific | Provider-specific | Provider-specific | Provider-specific | Provider-specific | Allowed only with disclosure | TBD |

Do not mark a provider as approved unless the exact commercial account, model SKU, API endpoint, data-retention policy, and training policy have been reviewed.

## Required Evidence

Attach or link the following evidence before marking a provider approved:

- Terms of service and commercial-use permission.
- Privacy/data-processing policy.
- Data retention and deletion policy.
- Whether prompts, code, files, outputs, and metadata are used for training, evaluation, abuse review, or product improvement.
- Data processing location and cross-border transfer path.
- Abuse policy and prohibited-use obligations that affect generated code, credential handling, command execution, scraping, and security tooling.
- Rate limits, quota limits, price schedule, and failure behavior.
- Support/security contact and incident notification terms.

## Generative AI Filing And Security Assessment Gate

Before public paid launch, document a legal conclusion on whether Zingpop's service scope triggers generative AI filing, algorithm filing, security assessment, or similar procedures.

Minimum conclusion fields:

- Reviewer:
- Review date:
- Service scope reviewed:
- Public-opinion attribute or social mobilization capability conclusion:
- Algorithm filing / security assessment applicability:
- Required filings or exemptions:
- Operational constraints:
- Evidence links:

Until this section is completed, broad public commercialization remains blocked. Controlled internal testing can continue if production user data, model-provider data flows, and customer disclosures match the current legal pages.

## Abuse And Command-Execution Controls

The current launch baseline keeps command execution behind authenticated project routing and Nginx same-origin auth. Before scale-up, add or confirm:

- Per-account and per-workspace model-call throttles.
- Abnormal prompt and token spike alerts.
- Credential exfiltration and secret-pattern detection for prompts/logs where technically feasible.
- Command execution audit events with actor, workspace, project, session, timestamp, and command metadata.
- High-risk command review or blocklist for destructive, network-scanning, credential-exfiltration, and persistence actions.
- Emergency disable switch for model calls and terminal/command execution.

If a provider's terms prohibit a class of automated security, scraping, or code-execution workflow, enforce that restriction at the Zingpop product layer before enabling that provider for paid users.
