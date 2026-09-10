---
name: modular-typescript-optimization
description: "Refactor and optimize TypeScript or Next.js code for modular design, strict type accuracy, ESLint compliance, maintainability, and focused performance improvements. Use when splitting large modules, tightening types, removing duplication, improving boundaries, or fixing lint and TypeScript errors."
argument-hint: "Describe the code path, symptoms, constraints, and validation command if known."
user-invocable: true
---

# Modular TypeScript Optimization

Improve an existing TypeScript or Next.js code path without changing its intended behavior. Prefer small, verifiable changes that clarify ownership and make correctness visible in the types.

## When to Use

- A module has too many responsibilities or is difficult to test.
- TypeScript types are broad, duplicated, unsafe, or inaccurate.
- ESLint reports errors or the code relies on avoidable suppressions.
- A refactor should reduce duplication or improve extension points.
- A performance issue has been identified and the controlling code path is known.

## Procedure

### 1. Establish the local contract

1. Read the target file, its nearest caller, and the closest relevant type or test.
2. Check `package.json`, TypeScript configuration, ESLint configuration, and framework conventions that affect the change.
3. State one falsifiable hypothesis about the defect or design pressure.
4. Choose the cheapest focused check that could disprove the hypothesis.
5. Record existing behavior, public exports, runtime boundaries, and error-handling expectations before editing.

Do not broaden the search until a nearby dependency or ownership boundary is needed to distinguish competing explanations.

### 2. Choose a modular boundary

Separate code by responsibility, not by arbitrary file size. Consider these boundaries:

- UI rendering and interaction state.
- Framework/server transport such as route handlers and Server-Sent Events.
- Domain orchestration and business rules.
- Provider or external-service adapters.
- Pure transformations, validation, and formatting.
- Persistent state and browser-only storage.

Keep a module's public API small. Prefer one clear responsibility per exported function or type. Move code only when the new owner is unambiguous, and preserve import aliases and public behavior unless a breaking change is explicitly requested.

For Next.js code, keep secrets, filesystem access, and server-only SDKs behind server boundaries. Keep browser APIs and client state in client components or client-only modules. Do not solve a server/client boundary problem by weakening types or hiding imports behind unsafe casts.

### 3. Make the type contract explicit

1. Define domain types at the boundary where the data is created or received.
2. Prefer discriminated unions for states, providers, results, and errors with meaningful variants.
3. Use `unknown` for untrusted input, then validate or narrow it before use.
4. Give exported functions explicit parameter and return types when inference does not communicate the contract clearly.
5. Reuse canonical types instead of recreating structurally similar shapes.
6. Make optionality, nullability, units, and failure states explicit.
7. Avoid `any`, non-null assertions, unchecked casts, and `eslint-disable` comments. If one is unavoidable, isolate it at the narrowest boundary and explain why in the change summary.

Types should describe runtime truth. Do not use a type assertion to make an invalid state compile.

### 4. Refactor incrementally

1. Make the smallest edit that tests the hypothesis.
2. Extract pure logic before extracting stateful or framework-dependent logic when possible.
3. Pass dependencies and data explicitly rather than introducing hidden module state.
4. Preserve side-effect ordering, cancellation behavior, retries, cleanup, and user-visible errors.
5. Remove dead code and duplication only when the change is local and behavior is understood.
6. Keep names specific and avoid generic helpers such as `utils`, `data`, or `handleThing` when a domain name is available.
7. Do not add an abstraction for a single call site unless it establishes a meaningful boundary or removes real complexity.

For performance work, measure or inspect the hot path first. Prefer reducing unnecessary work, duplicate requests, serialization, or rerenders over speculative memoization. Preserve correctness before optimizing allocation or render frequency.

### 5. Validate after each meaningful slice

Run the narrowest applicable check immediately after the first substantive edit. Then run the repository gates:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Use a focused file or test command first when available. This repository has no test script, so lint, strict TypeScript checking, and the production build are the primary gates. Treat new warnings, type suppressions, bundle changes, and altered error behavior as review items even if the commands pass.

If validation fails:

- Repair the same slice and rerun the same check when the failure supports the current hypothesis.
- If the failure disproves the hypothesis, take one nearby hop to the code that actually controls the behavior.
- Do not widen the refactor while a local validation failure is unresolved.

### 6. Review the resulting contract

Before finishing, verify:

- The changed module has one clear reason to change.
- Imports flow in a sensible direction and no accidental cycle was introduced.
- Public exports and call sites use precise, reusable types.
- Server-only and client-only code remain correctly isolated.
- Errors and loading states remain observable and actionable.
- No behavior changed unintentionally at provider, API, storage, or UI boundaries.
- ESLint and strict TypeScript pass without broad suppressions.
- The production build succeeds, or any pre-existing/environmental blocker is reported clearly.

Summarize the files changed, the behavior preserved or improved, validation performed, and any remaining risk. Do not claim a performance improvement without evidence or a clear mechanism.
