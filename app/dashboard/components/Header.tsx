"use client"

import { ChevronRight, Menu } from "lucide-react"
import { sidebarLinks } from "./sidebarLinksConfig"
import { useSidebar } from "./SidebarContext"
import { usePathname } from "next/navigation"

export default function Header() {
    const { setSidebarOpen } = useSidebar()
    const pathname = usePathname();
    let pageTitle = "";

    for(let l of sidebarLinks) {
        if (l.href == pathname) 
            pageTitle = l.title;
    }

    return <>
        <header
            className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 lg:px-10 shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="flex items-center text-sm font-medium text-slate-500">
                    <span>Admin</span>
                    <ChevronRight className="mx-1" />
                    <span className="text-slate-900 dark:text-white font-semibold">{pageTitle}</span>
                </div>
            </div>
            <Menu onClick={() => setSidebarOpen(true)} className="lg:hidden"/>
        </header>
    </>
}