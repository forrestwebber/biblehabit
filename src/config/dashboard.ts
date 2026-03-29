export interface NavItem {
  title: string
  href: string
  icon?: string
}

export interface DashboardConfig {
  mainNav: NavItem[]
  sidebarNav: NavItem[]
}

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "Documentation",
      href: "/docs",
    },
    {
      title: "Support",
      href: "/support",
    },
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
    },
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: "messageSquare",
    },
    {
      title: "Invoices",
      href: "/dashboard/invoices",
      icon: "billing",
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: "settings",
    },
  ],
}
