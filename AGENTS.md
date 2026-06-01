# Geyvak Codex Instructions

These instructions guide AI coding agents working on the Geyvak website repository.

## Core working rule

Make small, safe, reviewable changes. Do not make broad rewrites unless explicitly requested.

## Safety and privacy

- Never commit secrets, API keys, passwords, tokens, `.env` files, private credentials, or personal documents.
- Do not include private business plans, unpublished invention details, private community-support strategy, or sensitive personal information in repository files.
- Keep public-facing content calm, professional, ethical, and privacy-safe.
- If a task appears to expose private or sensitive information, stop and ask for review.

## Code quality

- Preserve the existing project structure unless a change is clearly needed.
- Keep pages mobile-friendly, accessible, readable, and lightweight.
- Prefer simple, maintainable code over complex solutions.
- Avoid adding paid services, heavy dependencies, tracking tools, or third-party integrations unless explicitly requested.
- Do not remove existing pages, content, assets, or configuration unless the task clearly asks for it.

## Website style

- Preserve the existing Geyvak visual direction and tone unless asked to redesign.
- Keep layouts clean, calm, nature-inspired, and user-friendly.
- Avoid overly corporate, aggressive, or hype-driven language.
- Do not reduce Geyvak to only one product or feature.

## Testing and reporting

Before finishing a task, run the available checks where practical, such as build, lint, or type checks.

At the end of every task, report:

1. Files changed
2. What was changed
3. Checks/tests run
4. Any errors or skipped checks
5. Risks or review notes
6. Recommended next action

## Branch and review practice

- Work on a separate branch for meaningful changes.
- Do not assume changes should be deployed immediately.
- Prefer pull requests for review before merging to the live branch.
