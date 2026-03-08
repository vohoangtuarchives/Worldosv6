export type NarrativeFactKind =
  | "chronicle"
  | "entropy-shift"
  | "stability-shift"
  | "knowledge-shift"
  | "civilization-field"
  | "event-summary";

export type NarrativeFactSeverity = "low" | "medium" | "high" | "critical";

export interface NarrativeEvidence {
  label: string;
  value: string;
}

export interface NarrativeFact {
  id: string;
  tick: number;
  title: string;
  summary: string;
  kind: NarrativeFactKind;
  severity: NarrativeFactSeverity;
  angle: string;
  evidence: NarrativeEvidence[];
}

export interface NarrativeDraftSection {
  heading: string;
  body: string;
}

export interface NarrativeDraft {
  title: string;
  dek: string;
  sections: NarrativeDraftSection[];
}
