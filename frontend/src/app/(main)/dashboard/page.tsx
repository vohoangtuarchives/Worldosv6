"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/micro");
  }, [router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
      Đang chuyển đến Micro…
    </div>
  );
}
