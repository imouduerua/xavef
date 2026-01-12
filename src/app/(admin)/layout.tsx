
'use client';

import React from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { SidebarInset } from "@/components/ui/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
    </>
  );
}
