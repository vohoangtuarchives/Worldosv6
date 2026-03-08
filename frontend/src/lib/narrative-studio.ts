import type { Chronicle, Snapshot, Universe } from "@/types/simulation";
import type {
  NarrativeDraft,
  NarrativeDraftSection,
  NarrativeFact,
  NarrativeFactSeverity,
} from "@/types/narrative";

export type NarrativePreset = "chronicle" | "story" | "beats";

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function severityFromDelta(delta: number): NarrativeFactSeverity {
  const magnitude = Math.abs(delta);
  if (magnitude >= 0.28) return "critical";
  if (magnitude >= 0.18) return "high";
  if (magnitude >= 0.08) return "medium";
  return "low";
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function titleCase(input: string) {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function chronicleTick(c: Chronicle): number {
  return (c as { to_tick?: number }).to_tick ?? c.tick ?? 0;
}

function chronicleDescription(c: Chronicle): string {
  return (c as { content?: string }).content ?? c.description ?? "";
}

function renderDraft(draft: NarrativeDraft) {
  return [
    `# ${draft.title}`,
    "",
    draft.dek,
    "",
    ...draft.sections.flatMap((section) => [`## ${section.heading}`, "", section.body, ""]),
  ].join("\n");
}

export function buildNarrativeFacts(params: {
  universe?: Universe | null;
  snapshots: Snapshot[];
  chronicles: Chronicle[];
}): NarrativeFact[] {
  const { snapshots, chronicles } = params;
  const facts: NarrativeFact[] = [];

  const sortedSnapshots = [...snapshots].sort((a, b) => a.tick - b.tick);
  const first = sortedSnapshots[0];
  const last = sortedSnapshots[sortedSnapshots.length - 1];
  const firstId = first?.id ?? first?.tick;
  const lastId = last?.id ?? last?.tick;

  if (first && last && firstId !== lastId) {
    const entropyDelta = last.entropy - first.entropy;
    const stabilityDelta = last.stability_index - first.stability_index;
    const knowledgeDelta =
      asNumber(last.metrics?.knowledge_core) - asNumber(first.metrics?.knowledge_core);

    facts.push({
      id: `entropy-${lastId}`,
      tick: last.tick,
      title: entropyDelta >= 0 ? "Áp lực entropy tăng" : "Entropy giảm",
      summary:
        entropyDelta >= 0
          ? `Entropy tăng ${formatPct(entropyDelta)} trong cửa sổ đã chọn, cho thấy áp lực hỗn loạn đang leo thang.`
          : `Entropy giảm ${formatPct(Math.abs(entropyDelta))}, cho thấy hệ thống đang lấy lại trật tự.`,
      kind: "entropy-shift",
      severity: severityFromDelta(entropyDelta),
      angle:
        entropyDelta >= 0
          ? "Viết như chương tiền khủng hoảng: trật tự bề ngoài còn đó nhưng vết nứt đã hé lộ."
          : "Viết như chương hậu chấn: hệ thống vừa thoát ngưỡng nguy hiểm và đang cố ổn định.",
      evidence: [
        { label: "Từ tick", value: String(first.tick) },
        { label: "Đến tick", value: String(last.tick) },
        { label: "Entropy đầu", value: first.entropy.toFixed(3) },
        { label: "Entropy cuối", value: last.entropy.toFixed(3) },
      ],
    });

    facts.push({
      id: `stability-${lastId}`,
      tick: last.tick,
      title: stabilityDelta >= 0 ? "Ổn định củng cố" : "Ổn định rạn vỡ",
      summary:
        stabilityDelta >= 0
          ? `Ổn định tăng ${formatPct(stabilityDelta)}, cho thấy thể chế hoặc mô hình hệ thống vẫn đang giữ vững.`
          : `Ổn định mất ${formatPct(Math.abs(stabilityDelta))}, cho thấy tan rã hoặc thất bại thể chế đang đến gần.`,
      kind: "stability-shift",
      severity: severityFromDelta(stabilityDelta),
      angle:
        stabilityDelta >= 0
          ? "Dùng làm nhịp phục hồi trước làn sóng xung đột tiếp theo."
          : "Dùng làm bước ngoặt chương: bề ngoài yên ả nhưng nền móng đang trượt.",
      evidence: [
        { label: "Ổn định đầu", value: first.stability_index.toFixed(3) },
        { label: "Ổn định cuối", value: last.stability_index.toFixed(3) },
        { label: "Chênh lệch", value: stabilityDelta.toFixed(3) },
      ],
    });

    if (knowledgeDelta !== 0) {
      facts.push({
        id: `knowledge-${lastId}`,
        tick: last.tick,
        title:
          knowledgeDelta >= 0
            ? "Biên giới tri thức mở rộng"
            : "Năng lực tri thức thu hẹp",
        summary:
          knowledgeDelta >= 0
            ? `Lõi tri thức tăng ${formatPct(knowledgeDelta)}, là hạt giống mạnh cho đột phá hoặc nâng tầm văn minh.`
            : `Lõi tri thức giảm ${formatPct(Math.abs(knowledgeDelta))}, phù hợp mất mát, đàn áp, hoặc truyền tải chân lý bị đứt gãy.`,
        kind: "knowledge-shift",
        severity: severityFromDelta(knowledgeDelta),
        angle:
          knowledgeDelta >= 0
            ? "Viết như nhịp bình minh tri thức hoặc cảnh khám phá chiến lược."
            : "Viết như sự mù quáng tập thể, thể chế sụp đổ, hoặc ký ức bị bóp méo.",
        evidence: [
          {
            label: "Tri thức đầu",
            value: asNumber(first.metrics?.knowledge_core).toFixed(3),
          },
          {
            label: "Tri thức cuối",
            value: asNumber(last.metrics?.knowledge_core).toFixed(3),
          },
        ],
      });
    }

    const civFields = (last.metrics?.civ_fields ?? {}) as Record<string, unknown>;
    const dominantFieldEntry = Object.entries(civFields)
      .filter(([, value]) => typeof value === "number")
      .sort((a, b) => asNumber(b[1]) - asNumber(a[1]))[0];

    if (dominantFieldEntry) {
      const [fieldName, fieldValue] = dominantFieldEntry;
      facts.push({
        id: `field-${lastId}`,
        tick: last.tick,
        title: `${titleCase(fieldName)} trở thành trường văn minh chủ đạo`,
        summary: `Trường ${titleCase(fieldName)} đang chi phối trạng thái văn minh ở ${formatPct(asNumber(fieldValue))}. Đây là điểm neo mạnh cho quyết định tông giọng và góc nhìn.`,
        kind: "civilization-field",
        severity: asNumber(fieldValue) > 0.7 ? "high" : "medium",
        angle: `Dùng ${titleCase(fieldName)} làm xương sống cảm xúc hoặc chính trị cho cảnh/chương tiếp theo.`,
        evidence: [
          {
            label: "Trường chủ đạo",
            value: `${titleCase(fieldName)} (${asNumber(fieldValue).toFixed(3)})`,
          },
        ],
      });
    }
  }

  const chronicleFacts: NarrativeFact[] = chronicles.slice(0, 6).map((chronicle) => ({
    id: `chronicle-${chronicle.id}`,
    tick: chronicleTick(chronicle),
    title: chronicle.event_type ? titleCase(chronicle.event_type) : "Sự kiện thế giới",
    summary: chronicleDescription(chronicle),
    kind: "chronicle" as const,
    severity: (chronicle.event_type?.includes("collapse") ? "critical" : "medium") as NarrativeFactSeverity,
    angle:
      "Có thể chuyển trực tiếp thành beat cảnh, mở đầu câu chuyện, hoặc neo chương.",
    evidence: [
      { label: "ID biên niên", value: String(chronicle.id) },
      { label: "Tick", value: String(chronicleTick(chronicle)) },
      { label: "Loại", value: chronicle.event_type || chronicle.type || "event" },
    ],
  }));

  facts.push(...chronicleFacts);

  return facts.sort((a, b) => b.tick - a.tick);
}

export function buildNarrativeDraft(
  universe: Universe | null | undefined,
  facts: NarrativeFact[]
): NarrativeDraft {
  const leadFacts = facts.slice(0, 4);
  const latestTick = leadFacts[0]?.tick ?? universe?.current_tick ?? 0;
  const title = `Bản nháp biên niên ${universe?.name || `Universe #${universe?.id ?? "?"}`}`;
  const dek =
    leadFacts[0]?.summary ||
    "Bản nháp này được xây từ sự kiện WorldOS, biến động entropy–ổn định và bản ghi biên niên.";

  const sections = [
    {
      heading: "Mở đầu",
      body:
        `Tick ${latestTick} mở ra một bề mặt lịch sử đã chuyển động.` +
        (leadFacts[0]
          ? ` ${leadFacts[0].summary}`
          : " Chưa đủ tín hiệu để tạo mở đầu xung đột mạnh hơn."),
    },
    {
      heading: "Áp lực văn minh",
      body:
        leadFacts[1]?.summary ||
        "Áp lực văn minh nên được dàn dựng như sự tích tụ chậm: entropy, bất ổn và dịch chuyển trường không bùng cùng lúc, nhưng đang kéo trật tự ra xa cân bằng ban đầu.",
    },
    {
      heading: "Góc biên tập",
      body:
        leadFacts.map((fact) => `- ${fact.title}: ${fact.angle}`).join("\n") ||
        "- Chưa đủ fact để đề xuất góc biên tập cụ thể.",
    },
  ];

  return { title, dek, sections };
}

function buildStorySections(facts: NarrativeFact[]): NarrativeDraftSection[] {
  const opening = facts[0];
  const pressure = facts[1];
  const pivot = facts[2];

  return [
    {
      heading: "Cảnh một",
      body:
        opening
          ? `Chương mở ở tick ${opening.tick}. ${opening.summary} Máy quay narrative nên bám sát đường đứt gãy thay vì toàn bản đồ.`
          : "Mở bằng góc nhìn hẹp bên trong một hệ thống đã chịu áp lực nhưng chưa thừa nhận.",
    },
    {
      heading: "Cảnh hai",
      body:
        pressure
          ? `${pressure.summary} Dùng nhịp giữa này để biến áp lực mô phỏng thành áp lực xã hội hoặc cảm xúc.`
          : "Chuyển áp lực số liệu thành stake con người hữu hình: sợ hãi, tính sai, tham vọng, hoặc chối bỏ.",
    },
    {
      heading: "Cảnh ba",
      body:
        pivot
          ? `${pivot.summary} Kết chương trên bước ngoặt làm thay đổi điều khán giả từng tin là ổn định.`
          : "Kết bằng sự bộc lộ hoặc dịch chuyển khiến trạng thái cân bằng cũ không thể quay lại.",
    },
  ];
}

function buildBeatSections(facts: NarrativeFact[]): NarrativeDraftSection[] {
  const beats = facts.slice(0, 5);
  return [
    {
      heading: "Beats chương",
      body:
        beats.length > 0
          ? beats
              .map(
                (fact, index) =>
                  `${index + 1}. Tick ${fact.tick} - ${fact.title}: ${fact.summary} Góc: ${fact.angle}`
              )
              .join("\n\n")
          : "1. Thiết lập trạng thái thế giới.\n\n2. Đưa áp lực ngầm lên bề mặt.\n\n3. Kích hoạt dịch chuyển hữu hình.\n\n4. Kết bằng hậu quả.",
    },
  ];
}

export function buildPresetDraft(
  preset: NarrativePreset,
  universe: Universe | null | undefined,
  facts: NarrativeFact[]
) {
  const base = buildNarrativeDraft(universe, facts);

  if (preset === "story") {
    return renderDraft({
      title: `${universe?.name || `Universe #${universe?.id ?? "?"}`} – Bản Truyện`,
      dek: "Bản kể chuyện hóa, biến fact mô phỏng thành cảnh, áp lực và bước ngoặt.",
      sections: buildStorySections(facts),
    });
  }

  if (preset === "beats") {
    return renderDraft({
      title: `${universe?.name || `Universe #${universe?.id ?? "?"}`} – Beats chương`,
      dek: "Bảng beat sản xuất từ các fact mạnh nhất trong cửa sổ mô phỏng hiện tại.",
      sections: buildBeatSections(facts),
    });
  }

  return renderDraft(base);
}
