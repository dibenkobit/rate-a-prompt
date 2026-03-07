# OSS package.json Fields

## Context

rate-a-prompt is an open-source web app deployed by the maintainer. It is not published to npm. The codebase is open for transparency and contributions.

## Changes

Added the following fields to `package.json`:

| Field | Value | Rationale |
|---|---|---|
| `description` | "Evaluate and compare LLM prompt quality side-by-side" | Project discoverability |
| `license` | "MIT" | Permissive OSS license |
| `author` | "Nikita Snetkov (https://github.com/dibenkobit)" | Attribution |
| `repository` | GitHub URL | Links npm/GitHub metadata |
| `homepage` | GitHub readme link | Entry point for visitors |
| `bugs` | GitHub issues URL | Where to report issues |
| `keywords` | llm, prompt, evaluation, ai, comparison | Discoverability |
| `packageManager` | "bun@1.3.9" | Corepack enforcement |
| `engines` | bun >=1.3.0 | Contributor environment consistency |

## Decisions

- **Kept `"private": true`** — prevents accidental npm publish, appropriate for a non-package web app.
- **No `funding` field** — can add later if needed.
- **No `contributors` field** — GitHub handles this automatically.
- **Bun-only engines** — project uses bun exclusively, no Node requirement.
