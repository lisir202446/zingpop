# Zingpop Homepage Redesign

Date: 2026-04-24
Scope: `packages/console/app/src/routes/index.tsx` and homepage-adjacent content/assets only
Status: Design approved in chat, pending user review of this written spec

## Goal

Redesign the `/` homepage so it feels like a complete, formal product website in the existing `opencode` visual style, while repositioning the product for programming beginners rather than enterprise buyers or experienced developers.

The homepage should make three things obvious within one scroll:

1. Zingpop is for ordinary people who do not know how to code.
2. The primary action is to start now by registering or logging in.
3. Zingpop helps users get good results because important capabilities are already prepared inside the product.

## Problem Summary

The current homepage is not acceptable as the final Zingpop homepage because:

- It reads like a minimal entry page instead of a formal website.
- The main copy is garbled.
- Main content bypasses the existing i18n approach.
- The page no longer communicates the depth, confidence, and polish of the previous `opencode` homepage structure.
- The current message is too abstract for non-technical users and does not clearly show what they can make.

## Product Positioning

The homepage should frame Zingpop as a tool that helps beginners make real, presentable products without first learning complicated workflows.

The key brand idea is:

`Many of the hard setup steps are already prepared inside Zingpop, so beginners do not have to start from a blank page or figure everything out alone.`

The homepage may mention the built-in foundations directly, but only as proof of the product philosophy, not as a technical explainer:

- `skill`
- `prompt`
- `context`
- `plugin`
- `mcp`

These terms should appear alongside plain-language explanations of what they mean for a beginner. The page should never assume the reader already understands them.

## Audience

Primary audience:

- Individual beginners
- People with ideas but little or no coding knowledge
- Users who want quick, visible outcomes such as pages, prototypes, simple tools, and creative work

Secondary audience:

- Curious makers who can evaluate product quality visually but do not want a developer-first homepage

Explicit non-audience for this page:

- Enterprise buyers
- Procurement or sales-led evaluation flows
- Readers looking for deep technical architecture details

## Non-Goals

This redesign does not:

- Turn the homepage into a technical docs page
- Lead with enterprise messaging
- Explain implementation details of `skill`, `mcp`, or plugins
- Add brand-new backend product features
- Redesign the overall site visual language away from the existing `opencode` feel
- Rebuild the homepage from scratch if the existing `opencode` marketing structure can be reused

## Visual Direction

The homepage should preserve the editorial, restrained, trustworthy tone of the existing `opencode` marketing site.

The default implementation rule is:

`Reuse the existing opencode homepage design language as much as possible, and change content and visual assets first.`

Keep:

- Sticky header
- Bordered central container
- Sectioned long-scroll structure
- Quiet, high-contrast typography
- Minimal but intentional motion
- Existing FAQ, email signup, footer, and legal ending structure

Avoid:

- Loud startup landing-page gradients
- Excessive badges or growth-hacking UI
- Overly playful cartoon styling
- Feature-grid overload without narrative structure

The page should feel like the same family as `opencode`, but with warmer beginner-facing messaging.

This redesign should prefer content replacement over visual reinvention.

That means:

- Reuse existing homepage section rhythm where possible
- Reuse existing shared components before introducing new ones
- Reuse existing CSS patterns before adding new visual systems
- Prefer swapping copy, illustrations, and screenshots over rebuilding layout primitives
- Only make style changes when the current presentation blocks the beginner-facing positioning

## Homepage Structure

### 1. Header

Reuse the existing homepage-style header shell so the site immediately reads as a full product website.

Behavior:

- Sticky at top
- Primary CTA visible in the header
- Navigation remains short and clear

Navigation intent:

- Home
- Docs or New User Guide
- Login
- Primary CTA: `Start now` or equivalent locale-aware beginner-friendly start action

If current shared header copy remains too developer-oriented, adapt only the homepage presentation and CTA wording rather than changing unrelated site areas.

### 2. Hero

Purpose:

- State the beginner promise clearly
- Make starting immediately feel safe
- Set the primary conversion action

Content direction:

- Headline in plain language, centered on outcomes rather than code
- Supporting copy that explains Zingpop helps users make presentable products without needing to understand complicated setup first
- Main CTA: `Start now / Sign up or log in`
- Secondary CTA: `See what you can make`

Tone:

- Confident
- Reassuring
- Concrete
- Non-technical

The hero must not read like a developer tool install page.

### 3. Result-Oriented Case Studies

Purpose:

- Show what beginners can actually make
- Replace abstract capability talk with visible outcomes

This section appears immediately after the hero.

Required case-study categories:

- Mini game
- Personal homepage
- Small utility tool
- Art showcase

Presentation:

- Four cards or tiles
- Each card shows a realistic product-style visual, not a vague concept image
- Each card includes a short beginner-readable caption explaining the outcome

Image direction:

- Use screenshot-like or interface-like visuals
- Generate visual assets with OpenAI `gpt-image-2` during implementation
- The homepage itself should not mention the model name

Copy direction:

- Focus on what the user can end up with
- Example framing: starting from one idea, ending with something visible, shareable, and editable

### 4. Philosophy Section

Purpose:

- Explain why beginners can succeed in Zingpop
- Introduce the product difference without turning the page into a technical explanation

Core message:

`Zingpop already prepares many of the difficult pieces for you, so you do not need to piece together the workflow from scratch.`

This section may mention:

- `skill`
- `prompt`
- `context`
- `plugin`
- `mcp`

But each must be translated into beginner benefit language:

- `skill`: common task know-how is already prepared
- `prompt`: users do not need to invent the perfect wording from nothing
- `context`: the product can continue from what the user was already doing
- `plugin`: more capabilities can be added without changing tools
- `mcp`: future connections to tools and information sources are already planned into the product path

This section should read as reassuring evidence, not as a glossary.

### 5. Capability List

Purpose:

- Preserve the strong list-based product credibility of the old `opencode` homepage
- Reframe capabilities around user benefit

This section should feel like the old capability inventory, but written for non-technical readers.

Possible capability statements:

- Continue from the last step instead of restarting every time
- Handle long edits and multi-step revisions
- Help shape pages, prototypes, tools, and creative outputs
- Combine prepared abilities together instead of making users assemble a process alone
- Support more ready-to-use tasks over time
- Move toward click-to-start workflows inside the workspace

The list should feel substantial, but still readable in one pass.

### 6. Open and Start Workspace Preview

Purpose:

- Prepare users for the upcoming workspace direction
- Make the product feel easier than a blank chat box

Message:

The workspace will increasingly include ready-to-use starting points with built-in prompts and skills, so users can click a task and begin rather than facing an empty input field.

Example task ideas to present:

- Make a homepage
- Make a mini-game prototype
- Generate a practical utility tool
- Make a showcase page
- Rewrite and improve existing content

This section is aspirational but should be phrased honestly:

- It can describe the product direction already being built
- It must not claim fully shipped experiences that do not yet exist

### 7. Beginner Three-Step Flow

Purpose:

- Reduce fear
- Make onboarding feel simple

Flow:

1. Sign up or log in
2. Choose a task you want to make
3. Review the result and keep refining it

This section should be visually simple and fast to understand.

### 8. FAQ

Purpose:

- Resolve beginner hesitation before they leave the page

Question direction:

- Can I use this if I do not know how to code?
- What should I do if I do not know how to begin?
- Can I choose a ready-made task instead of starting from scratch?
- Can I keep editing what I made afterward?
- Will there be more ready-to-use tasks over time?

Reuse the current FAQ component and existing homepage ending structure where practical.

### 9. Email Signup, Footer, Legal

Reuse the existing shared homepage-ending structure to restore polish and completeness:

- Email signup
- Footer
- Legal

This is required so the homepage no longer feels cut short.

## Copy Principles

All homepage copy should follow these rules:

- Explain outcomes before systems
- Use human language before product jargon
- Mention technical terms only when attached to a beginner-readable meaning
- Avoid enterprise wording
- Avoid API-first or model-first framing
- Keep the user focused on confidence, momentum, and visible results

The page should repeatedly answer:

- What can I make?
- Why is this easier here?
- What should I click next?

## i18n Requirements

The homepage must return to the project's i18n system for primary user-facing content.

Requirements:

- Do not keep homepage body content in one hard-coded static object
- Do not mix translated nav labels with hard-coded body copy
- Add or reuse locale keys so the homepage remains consistent across supported locales
- Eliminate the current garbled text entirely

If full locale parity is too large for one implementation pass, the implementation plan should still preserve the i18n architecture and avoid another hard-coded bypass.

## Component Reuse Strategy

Prefer reusing existing marketing-site components and styling patterns where they fit:

- `Header`
- `Faq`
- `EmailSignup`
- `Footer`
- `Legal`
- Existing homepage section styling patterns from the old `opencode` route

Do not force reuse where the old copy structure is strongly developer-specific. Reuse layout and tone first, content second.

Implementation priority should be:

1. Reuse the existing `opencode` homepage layout and section framing
2. Replace copy to match Zingpop beginner positioning
3. Replace media and visual assets to match Zingpop examples
4. Add new structural or styling code only where reuse clearly fails

## Asset Strategy

Homepage visuals for the case-study section should be added as curated assets rather than generated live at request time in the browser.

Plan:

- Generate screenshot-style case-study images with OpenAI `gpt-image-2`
- Save the approved outputs as local assets in the app package
- Use those local assets in the homepage cards

This avoids runtime dependency on external image generation while still benefiting from higher-quality visuals.

## Acceptance Criteria

The redesign is successful when:

1. `/` reads as a complete, formal homepage rather than a minimal entry screen.
2. The most prominent action on first view is `Start now / Sign up or log in`.
3. The first major section after the hero shows what users can make through concrete examples.
4. The page clearly targets beginners, not enterprise buyers.
5. The philosophy section communicates that important foundations are already built in, including mention of `skill / prompt / context / plugin / mcp` in beginner-friendly language.
6. The page preserves the overall polish and tone of the old `opencode` homepage structure.
7. Garbled text is fully removed.
8. Homepage body content returns to the i18n system.
9. The ending structure includes FAQ, email signup, footer, and legal sections.
10. The implementation mostly reuses `opencode` homepage structure and design patterns, with changes focused on content and assets rather than a wholesale visual rewrite.

## Verification Plan

Implementation should be verified with:

1. Route-level visual inspection of the homepage at desktop and mobile widths
2. A code check that the homepage no longer relies on the current static `homePage` object for main body copy
3. Package-level typecheck from `packages/console/app`
4. If the local build environment allows it, a production build check from `packages/console/app`

## Scope Boundary for Implementation Planning

This design is intentionally limited to the homepage and its directly required assets/copy structure.

It does not include:

- Reworking the workspace itself
- Shipping the future click-to-start task system
- Rewriting unrelated routes
- Redesigning the entire shared navigation system across the site

The implementation should focus on one high-quality homepage pass, with minimal unrelated edits.
