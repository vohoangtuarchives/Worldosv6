# Deterministic Replay (Doc §27, §26)

Replay simulation từ tick N để debug hoặc so sánh kết quả. **Deterministic replay** = cùng seed + cùng engine manifest.

## Điều kiện

- **Seed:** Universe/World dùng cùng `world_seed` (và kernel_genome nếu có).
- **Engine manifest:** Snapshot lưu `metrics.engine_manifest` (name → version). Khi replay, manifest hiện tại phải khớp với manifest tại thời điểm snapshot thì replay mới deterministic.

## Command

```bash
php artisan worldos:replay {universe} --from-tick=N [--to-tick=M] [--allow-manifest-mismatch]
```

- Nếu snapshot có `engine_manifest` và manifest hiện tại khác: command **fail** (exit 1) trừ khi dùng `--allow-manifest-mismatch`. Khi dùng flag đó, replay vẫn chạy nhưng có thể không deterministic.
- `--to-tick=M`: sau khi chạy, so sánh output với snapshot lưu tại tick M (nếu có).

## Pin engine versions

Để replay luôn deterministic với snapshot cũ: giữ nguyên version các engine (không nâng cấp) khi replay, hoặc dùng snapshot được tạo với engine_manifest đã lưu. Rule versioning (rule_proposals.deployed_at + engine_manifest_snapshot) cho phép biết rule set tại thời điểm deploy.
