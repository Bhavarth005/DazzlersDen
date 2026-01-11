'use client'

import Image from "next/image"
import SidebarLink from "./SidebarLink"
import { CircleX, UserCog } from "lucide-react"
import { sidebarLinks } from "./sidebarLinksConfig";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSidebar } from "./SidebarContext";
import { toast } from "sonner";

export default function Sidebar({ userRole }: { userRole?: string} ) {
    const router = useRouter();
    
    const pathname = usePathname();

    const handleLogout = async () => {
        const res = await fetch("/api/logout", {
            method: "POST"
        });

        const data = await res.json();
            
        if (res.ok) { // Check res.ok instead of relying just on message string
            localStorage.removeItem("access_token");
            toast.info("Logged out successfully");
            
            setTimeout(() => {
                router.refresh(); 
            }, 1000);
        }
    }

    const { sidebarOpen, setSidebarOpen } = useSidebar();
    const visibleLinks = sidebarLinks.filter((link) => {
        // If it's the Bonus Config link, ONLY show if role is super_admin
        if (link.superAdminOnly) {
            return userRole === 'SUPERADMIN';
        }
        // Show all other links by default
        return true; 
    });

    useEffect(() => {
        // Only run this logic on mobile when sidebar is OPEN
        if (sidebarOpen && window.innerWidth < 1024) {
            // Push a "dummy" state to history so "Back" has something to pop
            window.history.pushState({ sidebar: 'open' }, '', window.location.href);

            const handleBackButton = (_: any) => {
                // When "Back" is pressed, close sidebar
                setSidebarOpen(false);
            };

            window.addEventListener('popstate', handleBackButton);

            return () => {
                window.removeEventListener('popstate', handleBackButton);
            };
        }
    }, [sidebarOpen]);

    return (<>
        {sidebarOpen && (
            <div 
                onClick={() => setSidebarOpen(false)} // Close on click
                className="fixed inset-0 bg-black/50 z-999 lg:hidden glass transition-opacity"
            />
        )}

        <aside
            className={`
                fixed inset-y-0 left-0 z-9999 w-full bg-sidebar-bg flex flex-col h-full text-slate-300 transition-transform duration-300 ease-in-out
                lg:static lg:translate-x-0 lg:w-64
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            `}>
            
            <div className="flex items-center justify-between gap-3 px-6 py-6 border-b border-slate-800">
                <div className="flex items-center gap-3 ">
                    <div className="rounded-lg bg-white size-12 flex items-center justify-center text-white shrink-0">
                        <Image alt="Dazzler's Den Logo" src="/logo.png" className="p-2" width={128} height={128} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <h1 className="text-white text-base font-semibold leading-tight truncate">Dazzler's Den</h1>
                        <p className="text-slate-400 text-xs font-medium truncate">Admin Console</p>
                    </div>
                </div>
                <CircleX size={36} className="lg:hidden" onClick={() => setSidebarOpen(false)}/>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 no-scrollbar">
                {visibleLinks.map((link) => {
                    const isActive = link.exact
                        ? pathname === link.href
                        : pathname.endsWith(link.href);

                    return (
                        <SidebarLink
                            key={link.href}
                            title={link.title}
                            icon={link.icon}
                            href={link.href}
                            active={isActive}
                        />
                    );
                })}
            </nav>
            
            <div className="flex flex-col gap-2 p-4 border-t border-slate-800">
                {userRole === "SUPERADMIN" && <SidebarLink
                    title='User Management'
                    icon={UserCog}
                    href={'/dashboard/user-management'}
                    active={pathname.endsWith("/dashboard/user-management")}
                />}
                <button
                    className="flex items-center gap-3 cursor-pointer w-full px-3 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    onClick={handleLogout}
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span className="text-sm font-medium">Log Out</span>
                </button>
            </div>
        </aside>
    </>
    )
}