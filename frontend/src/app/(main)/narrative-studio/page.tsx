import type { Metadata } from "next";
import NarrativeStudio from "@/components/Simulation/NarrativeStudio";

export const metadata: Metadata = {
  title: "Narrative Studio | WorldOS V6",
  description: "Trình soạn Universe -> Fact -> Draft cho sản xuất narrative WorldOS.",
};

export default function NarrativeStudioPage() {
  return <NarrativeStudio />;
}
