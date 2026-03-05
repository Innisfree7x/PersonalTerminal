# Phase 17 - AI Guardrails + Eval Gate

Status: Implemented on `main`  
Date: 2026-03-05

## Goal
Harden AI-adjacent runtime paths so malformed intent/event payloads are blocked deterministically, and add an explicit CI eval gate.

## Scope
1. Central runtime contracts for command intents.
2. Input guardrails for command parsing.
3. Event-specific analytics payload validation for onboarding/trajectory critical events.
4. Dedicated eval suite in CI (`AI eval suite`).

## Implemented Files
- `lib/ai/contracts.ts`
  - `commandIntentSchema`
  - `commandPreviewSchema`
  - limits: `AI_COMMAND_MAX_CHARS`, `AI_COMMAND_TITLE_MAX_CHARS`
- `lib/ai/guardrails.ts`
  - `normalizeCommandInput()`
  - `guardCommandInput()`
- `lib/command/parser.ts`
  - now uses guardrails + contract validation before returning success payloads
- `lib/command/executor.ts`
  - validates received `CustomEvent` intent payloads with runtime schema before execution
- `lib/analytics/events.ts`
  - adds event-specific validation for:
    - `onboarding_step_completed`
    - `onboarding_completed`
    - `trajectory_goal_created`
    - `trajectory_capacity_set`
    - `trajectory_status_shown`
    - `demo_seed_removed`
- `tests/evals/command-intent-contract.eval.test.ts`
- `tests/evals/analytics-event-contract.eval.test.ts`
- `tests/unit/command-parser.test.ts`
- `tests/unit/analytics-events-schema.test.ts`
- `.github/workflows/ci.yml`
  - explicit `AI eval suite` step in `Quality Checks`
- `package.json`
  - new scripts:
    - `test:unit`
    - `test:evals`

## CI Contract (Required)
`Quality Checks` now enforces:
1. `npm run type-check`
2. `npm run lint`
3. `npm run test:unit`
4. `npm run test:evals`
5. `npm run build`

## Guardrail Rules (Operational)
1. Command input > 280 chars is rejected explicitly.
2. Parsed command intents must pass `commandIntentSchema` before execution.
3. Critical onboarding/trajectory analytics events must pass event-specific payload contracts.
4. Any new high-impact AI-adjacent event/intent requires:
   - schema update
   - eval test update
   - CI stays green with `AI eval suite`.

## Follow-up
1. Add API-route integration tests for malformed analytics payloads on every event-specific contract.
2. Add one E2E assertion for command-intent reject UX (oversized input guardrail).
