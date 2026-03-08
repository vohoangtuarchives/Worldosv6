# Modular Monolith Checklist

Use this file when reviewing an existing codebase or proposing a refactor.

## Boundary checks

- Does each module have a clear business capability?
- Are module names domain terms rather than technical buckets?
- Can you explain each module without mentioning database tables first?
- Are module entrypoints explicit?
- Do peer modules avoid importing each other's internals?

## Domain model checks

- Are aggregates defined by invariants rather than persistence shape?
- Do entities and value objects use domain language?
- Are business rules concentrated in domain code instead of controllers, jobs, or repositories?
- Are domain services rare and justified?
- Are domain events used where loose coupling is preferable?

## Application layer checks

- Are use cases easy to find?
- Does orchestration live in application services or handlers?
- Are transactions scoped to a meaningful consistency boundary?
- Are authorization, validation, and workflow steps explicit?

## Infrastructure checks

- Are ORM concerns isolated from core domain behavior where practical?
- Do repositories express domain intent instead of generic CRUD-only contracts?
- Are external APIs wrapped in adapters or gateways?
- Is framework code prevented from leaking deeply into the domain?

## Coupling smells

- `shared` module keeps growing
- one module writes directly into another module's tables
- domain rules duplicated in controllers and jobs
- repositories returning raw persistence models everywhere
- cross-module imports needed for ordinary changes
- one "god" module coordinates most workflows

## Refactor moves

- Extract public module interfaces before moving files.
- Replace direct calls to internals with application services or events.
- Move rules next to the aggregate that owns the invariant.
- Introduce value objects for repeated primitive concepts.
- Split read models from write-side invariants when complexity grows.
- Add tests around module public APIs before deeper restructuring.

## Deliverable template

When producing an architecture recommendation, aim to return:

1. Current pain points
2. Proposed modules
3. Public responsibilities per module
4. Domain model candidates
5. Dependency rules
6. Incremental migration steps
7. Risks and unresolved decisions
