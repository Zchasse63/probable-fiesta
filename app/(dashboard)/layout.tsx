'use client';

import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LayoutDashboard, Package, DollarSign, Users, Truck, FileText } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", active: true },
  { label: "Inventory", icon: Package, href: "/inventory" },
  { label: "Pricing", icon: DollarSign, href: "/pricing" },
  { label: "Customers", icon: Users, href: "/customers" },
  { label: "Freight", icon: Truck, href: "/freight" },
  { label: "Deals", icon: FileText, href: "/deals" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      sidebar={<Sidebar navItems={navItems} />}
      header={<Header />}
    >
      {children}
    </AppShell>
  );
}
