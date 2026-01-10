import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";

type SidebarLinkProps = {
    title: string;
    icon: LucideIcon;
    href: string;
    active?: boolean;
}

export default function SidebarLink({ title, icon: Icon, href, active = false }: SidebarLinkProps) {
    const { setSidebarOpen } = useSidebar();

    return <Link 
            className={"flex items-center gap-3 px-3 py-3.5 rounded-lg transition-colors hover:bg-slate-800 group" + 
                (active 
                ? "text-white shadow-sm ring-1 ring-white/10 bg-sidebar-active" 
                : "text-slate-300 hover:text-white")
            }
            href={href}
            onClick={() => setSidebarOpen(false)}
            >
                <Icon size={"20px"} className={active ? "text-primary" : "group-hover:text-white"}/>
                <span className="text-sm font-medium">{title}</span>
            </Link>
}