import { redirect } from "next/navigation";
import { getObserverUniverseSummariesServer } from "@/modules/observer/api";

export default async function UniversesPage() {
  // If there's only one universe, we could redirect, but the user wants a connected dashboard.
  // For now, let's redirect to the dashboard hub which shows all universes anyway.
  redirect("/dashboard");
}
