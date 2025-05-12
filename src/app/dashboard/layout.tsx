
"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  Users,
  Settings,
  Briefcase,
  ShieldAlert,
  // Bot, // Removed Bot icon
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/common/logo";
import { UserNav } from "@/components/common/user-nav";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/dashboard/customer", icon: LayoutDashboard, label: "My Dashboard", roles: [UserRole.Customer] },
  { href: "/dashboard/customer/submit", icon: FilePlus2, label: "New Complaint", roles: [UserRole.Customer] },
  { href: "/dashboard/admin", icon: LayoutDashboard, label: "Admin Dashboard", roles: [UserRole.Admin] },
  { href: "/dashboard/admin/manage-users", icon: Users, label: "Manage Users", roles: [UserRole.Admin] },
  // { href: "/dashboard/admin/ai-tools", icon: Bot, label: "AI Tools", roles: [UserRole.Admin] }, // Removed AI Tools
  { href: "/dashboard/engineer", icon: Briefcase, label: "My Tasks", roles: [UserRole.Engineer] },
  { href: "/dashboard/settings", icon: Settings, label: "Settings", roles: [UserRole.Customer, UserRole.Admin, UserRole.Engineer] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading || !user) {
     // Handled by AuthProvider, but good to have a fallback or show loading state
    return <div className="flex items-center justify-center h-screen">Loading dashboard...</div>;
  }

  const accessibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="p-4">
             <Logo className="group-data-[collapsible=icon]:hidden" />
             <ShieldAlert size={28} className="text-primary hidden group-data-[collapsible=icon]:block" />
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              <SidebarMenu>
                {accessibleNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (item.href !== `/dashboard/${user.role}` && pathname.startsWith(item.href))}
                        tooltip={{ children: item.label }}
                      >
                        <a>
                          <item.icon />
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-2">
            {/* Can add user info or logout here if sidebar is always expanded */}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            <SidebarTrigger className="md:hidden" /> {/* Mobile trigger */}
            <h1 className="text-xl font-semibold grow">
              {/* Dynamic title based on page can be added here */}
              Complaint Central
            </h1>
            <div className="ml-auto">
              <UserNav />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
