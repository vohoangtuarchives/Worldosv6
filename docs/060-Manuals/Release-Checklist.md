# Release Checklist

Checklist nay dung cho ban giao observer/autonomy ma khong bat buoc verify bang Docker prod.

## 1. Contract

- [ ] Khong con UI nao doan field tu response observer
- [ ] Cac route observer chinh con dung duoc:
- [ ] universes
- [ ] chronicles
- [ ] actors
- [ ] snapshots
- [ ] forks
- [ ] timeline
- [ ] control
- [ ] axioms
- [ ] `Observer API Contract` da duoc cap nhat neu co doi shape

## 2. Mutation workflow

- [ ] Advance simulation cap nhat panel lien quan ma khong can `router.refresh()`
- [ ] Toggle status cap nhat detail/metrics/reality pulse
- [ ] Create snapshot cap nhat snapshots lane
- [ ] Fork branch cap nhat forks lane va compare flow
- [ ] Actor detail + decision trail khong con placeholder blocker
- [ ] Mutation detail diff mo duoc tu autonomy audit

## 3. Observability

- [ ] Tab control hien du `Reality Core`
- [ ] Tab control hien du `Mutation Stream`
- [ ] Realtime subscription invalidate dung resource key
- [ ] Timeline tach du lane cho causal ticks / interventions / mutations
- [ ] `Apex` routes con expose:
- [ ] wavefunction
- [ ] informational mass
- [ ] mutation chronicle
- [ ] `/dashboard/ai-config` co diagnostics + telemetry dung duoc

## 4. UX

- [ ] Loading state co skeleton/co chu dich
- [ ] Empty state khong de text placeholder chung chung
- [ ] Empty state co CTA hop ly o route chinh
- [ ] Error state co retry
- [ ] Toast phan hoi thong nhat cho mutation observer
- [ ] Sidebar observer van dung tren mobile/tablet
- [ ] Header/shell observer van doc duoc tren mobile/tablet

## 5. Local release sanity

- [ ] Backend env da du
- [ ] Frontend `BACKEND_URL` trung backend local/staging
- [ ] Frontend `npx tsc --noEmit` pass
- [ ] Frontend lint pass
- [ ] Frontend build pass
- [ ] PHP syntax pass cho file backend moi/sua

## 6. Handoff docs

- [ ] Team moi vao repo tim thay tai lieu nay trong `docs/README.md`
- [ ] `Local Setup and Env` khop voi repo hien tai
- [ ] `Observer Frontend Structure` khop query key, realtime, va module structure hien tai
- [ ] `Observer API Contract` khop routes observer/apex hien tai
- [ ] Neu co endpoint moi, da duoc ghi vao `Observer API Contract`