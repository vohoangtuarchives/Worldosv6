"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ConfigSidebar from "@/components/config/ConfigSidebar";
import ConfigHeader from "@/components/config/ConfigHeader";
import GeneralSection from "@/components/config/sections/GeneralSection";
import PhysicsSection from "@/components/config/sections/PhysicsSection";
import SimulationSection from "@/components/config/sections/SimulationSection";
import PsychologySection from "@/components/config/sections/PsychologySection";
import EventsSection from "@/components/config/sections/EventsSection";
import DisplaySection from "@/components/config/sections/DisplaySection";
import ApiSection from "@/components/config/sections/ApiSection";
import KeyPoolSection from "@/components/config/sections/KeyPoolSection";
import Toast from "@/components/config/Toast";

const queryClient = new QueryClient();

export type ConfigSection =
  | "general"
  | "physics"
  | "simulation"
  | "psychology"
  | "events"
  | "display"
  | "api"
  | "keypool";

const SECTION_COMPONENTS: Record<ConfigSection, React.FC<{ onDirty: () => void }>> = {
  general: GeneralSection,
  physics: PhysicsSection,
  simulation: SimulationSection,
  psychology: PsychologySection,
  events: EventsSection,
  display: DisplaySection,
  api: ApiSection,
  keypool: KeyPoolSection,
};

function ConfigPageInner() {
  const [activeSection, setActiveSection] = useState<ConfigSection>("general");
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  const handleSave = () => {
    setIsDirty(false);
    setToast({ message: "Cấu hình đã được lưu thành công!", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="config-shell">
      <ConfigSidebar active={activeSection} onSelect={setActiveSection} />
      <div className="config-main">
        <ConfigHeader
          section={activeSection}
          isDirty={isDirty}
          onSave={handleSave}
        />
        <div className="config-content">
          <ActiveComponent onDirty={() => setIsDirty(true)} />
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default function ConfigPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigPageInner />
    </QueryClientProvider>
  );
}
