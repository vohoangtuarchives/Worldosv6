import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "IP Factory – WorldOS V6",
    description: "Biến Simulation thành IP: sinh chapter, phê duyệt, xây Story Bible",
};

export default function IpFactoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
