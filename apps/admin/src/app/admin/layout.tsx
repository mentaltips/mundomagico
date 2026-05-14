'use client'

import { AdminSidebar, AdminHeader, AdminBottomNav, SidebarProvider } from '../../components/layout/AdminShell'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
            {children}
          </main>
        </div>
      </div>
      <AdminBottomNav />
    </SidebarProvider>
  )
}
