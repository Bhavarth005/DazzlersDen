import {
  LayoutDashboard,
  QrCode,
  Users,
  CirclePlus,
  HistoryIcon,
  ReceiptIndianRupee,
  Gift,
  Megaphone,
} from "lucide-react";

export const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true, // special case for root
  },
  {
    title: "New Entry (Scan)",
    href: "/dashboard/new-entry",
    icon: QrCode,
  },
  {
    title: "All Customers",
    href: "/dashboard/all-customers",
    icon: Users,
  },
  {
    title: "New Customer",
    href: "/dashboard/new-customer",
    icon: CirclePlus,
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: ReceiptIndianRupee,
  },
  {
    title: "Entry History",
    href: "/dashboard/entry-history",
    icon: HistoryIcon,
  },
  {
    title: "Broadcast",
    href: "/dashboard/broadcast",
    icon: Megaphone,
  },
  {
    title: "Bonus Configuration",
    href: "/dashboard/bonus-config",
    icon: Gift,
    superAdminOnly: true
  },
];
