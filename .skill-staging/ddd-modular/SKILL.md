---
name: ddd-modular
description: Use this skill when designing, reviewing, or refactoring a Domain-Driven Design codebase, modular monolith, or domain-oriented service boundary. Trigger for requests about bounded contexts, aggregates, entities, value objects, domain services, application services, repository boundaries, module coupling, dependency direction, or splitting a large codebase into business-focused modules.
---

# DDD Modular

## Overview

Use this skill to shape software around business capabilities instead of technical layers alone.
It helps with new designs, incremental refactors, architecture reviews, and naming decisions in DDD and modular monolith codebases.

## Quick Start

1. Identify the business capabilities and user flows first.
2. Group behavior and data into candidate bounded contexts or modules.
3. Define the domain model inside each module: aggregates, entities, value objects, domain services, policies, events.
4. Place orchestration in application services, not in controllers or entities.
5. Enforce module boundaries so dependencies point inward to the domain, not sideways across peer modules.
6. Review persistence, messaging, and APIs as infrastructure adapters around the module boundary.

## When To Use This Skill

Use it when the user asks to:

- design a modular monolith or DDD architecture
- split a monolith into business modules
- review whether code follows DDD
- define aggregates or bounded contexts
- separate domain, application, and infrastructure responsibilities
- reduce cross-module coupling or shared-kernel sprawl
- prepare a gradual migration from layered code to domain-oriented modules

## Workflow

### 1. Map the domain

Start from business language, rules, workflows, and invariants.
Prefer module names from the domain language, such as `billing`, `catalog`, `identity`, `fulfillment`.
Avoid names that describe technical containers only, such as `common`, `core`, or `shared`, unless the scope is genuinely tiny and stable.

### 2. Find module boundaries

Split modules by business ownership and change patterns, not by CRUD tables.
Good module boundaries usually have:

- clear responsibilities
- distinct invariants
- their own application use cases
- limited reasons to change with other modules

If two areas need different language, different release cadence, or different rules, they are likely different modules or bounded contexts.

### 3. Model the inside of a module

Prefer this shape inside each module:

- `domain/`: entities, value objects, aggregates, domain services, domain events, specifications
- `application/`: use cases, command/query handlers, orchestration, transactions, permissions checks
- `infrastructure/`: ORM mappings, repositories, message buses, external API clients, persistence adapters
- `interfaces/` or framework entrypoints: controllers, routes, RPC handlers, jobs

Keep invariants inside aggregates or closely related domain logic.
Do not let controllers or repositories become the place where business rules really live.

### 4. Protect the domain model

Prefer rich domain behavior over anemic models when business rules matter.
Use entities for identity-bearing objects, value objects for immutable concepts, and domain services only when behavior does not naturally belong to one aggregate.

Ask these checks:

- What must always be true after this operation?
- Which aggregate owns that invariant?
- Which data is needed immediately, and which can be eventually consistent?
- Can another module learn about this through an event instead of a direct call?

### 5. Control dependencies

Allowed direction should usually be:

`interfaces -> application -> domain`

and

`infrastructure -> domain/application contracts`

Avoid peer modules importing each other's internals.
Cross-module collaboration should happen through:

- application-facing interfaces
- domain or integration events
- anti-corruption layers for legacy or external models

### 6. Refactor incrementally

For an existing messy codebase:

1. find one business capability with painful change coupling
2. extract a module boundary and public API
3. move use-case orchestration into application services
4. pull rules into domain objects and policies
5. hide persistence and frameworks behind adapters
6. remove direct cross-module reach-ins

Prefer seams and strangler-style refactors over large rewrites.

## Heuristics

- Aggregates should protect consistency boundaries, not mirror every table.
- Repositories should load and save aggregates, not become generic query dumpsters.
- Shared code should be extremely small; most `shared` folders grow into architecture debt.
- A module should expose capabilities, not internal tables or ORM models.
- If one request updates many aggregates across modules synchronously, the boundary is probably wrong or the workflow needs orchestration/events.
- Read models and reporting can be simpler and more query-oriented than the write model.

## Output Style

When helping the user, prefer this structure:

1. proposed modules or bounded contexts
2. responsibility of each module
3. domain model candidates inside each module
4. dependency rules
5. migration or refactor plan
6. risks, tradeoffs, and open questions

## Reference

If the task is an audit, detailed review, or refactor checklist, also read [references/modular-monolith-checklist.md](references/modular-monolith-checklist.md).
