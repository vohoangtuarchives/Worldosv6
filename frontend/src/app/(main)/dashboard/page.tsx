import { Suspense } from "react";
import { CosmologicDashboard } from "@/components/dashboard/CosmologicDashboard";

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-blue-400 font-mono animate-pulse">Initializing WorldOS Dashboard...</div>
      </div>
    }>
      <CosmologicDashboard />
    </Suspense>
  );
}
