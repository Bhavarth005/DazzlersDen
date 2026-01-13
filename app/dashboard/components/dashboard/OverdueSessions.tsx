'use client'

import { useState } from "react";
import { toast } from "sonner";
import ExitConfirmationModal from "./ExitConfirmationModal"; // Adjust path

export type OverdueSession = {
    id: number;
    name: string;
    phoneNo: string;
    children: number;
    adults: number;
    startTime: string;
    endTime: string;
    overdueTime: number;
}

// --- Overdue Exit Button ---
function OverdueExitButton({ sessionId, refreshData, fullWidth }: { sessionId: number, refreshData: () => void, fullWidth?: boolean }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirmExit = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/sessions/${sessionId}/exit`, { method: 'POST', });

            if (res.ok) {
                toast.success("Exit marked successfully");
                setIsModalOpen(false);
                refreshData(); 
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to mark exit");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`inline-flex items-center justify-center px-3 py-1.5 border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-semibold transition-colors disabled:text-gray-400 disabled:border-gray-400 disabled:hover:bg-transparent ${fullWidth ? 'w-full py-2 text-sm' : ''}`}
            >
                Mark Exit
            </button>

            <ExitConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmExit}
                isLoading={isLoading}
                isOverdue={true} // Triggers the RED warning text
            />
        </>
    )
}

function TableRow({ entry, refreshData }: { entry: OverdueSession, refreshData: () => void }) {
    return (
        <tr className="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors group">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                        {entry.name[0]}
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{entry.name}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{entry.phoneNo}</td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{entry.children}</td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{entry.adults}</td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{entry.startTime}</td>
            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{entry.endTime}</td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                    <span className="size-1.5 rounded-full bg-red-500"></span>
                    Overdue (+{entry.overdueTime}m)
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <OverdueExitButton sessionId={entry.id} refreshData={refreshData} />
            </td>
        </tr>
    );
}

// --- Mobile Card View ---
function MobileSessionCard({ entry, refreshData }: { entry: OverdueSession, refreshData: () => void }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-red-200 dark:border-red-900/50 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                        {entry.name[0]}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{entry.name}</h3>
                        <p className="text-xs text-slate-500">{entry.phoneNo}</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                    <span className="size-1.5 rounded-full bg-red-500"></span>
                    +{entry.overdueTime}m
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-red-50 dark:border-red-900/20">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Start</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{entry.startTime}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Expected End</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{entry.endTime}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Children</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{entry.children}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Adults</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{entry.adults}</p>
                </div>
            </div>

            <div className="w-full">
                <OverdueExitButton sessionId={entry.id} refreshData={refreshData} fullWidth />
            </div>
        </div>
    );
}

export default function OverdueSessions({ entries, refreshData }: { entries: OverdueSession[], refreshData: () => void }) {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const filteredRows = entries.filter(row =>
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.phoneNo.includes(search)
    );

    const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRows = filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const getPageNumbers = () => {
        let start = Math.max(1, currentPage - 1);
        let end = Math.min(totalPages, start + 2);
        if (end === totalPages) start = Math.max(1, end - 2);
        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col items-start gap-2 justify-between lg:flex-row lg:items-center">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="material-symbols-outlined text-red-500">warning</span>
                        <h3 className="text-slate-900 dark:text-white text-lg font-bold">
                            Overdue Sessions ({filteredRows.length})
                        </h3>
                    </div>
                    <div className="flex gap-2 w-full lg:w-72">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg h-12 w-full">
                            <span className="material-symbols-outlined text-lg ml-4">search</span>
                            <input
                                type="text"
                                className="flex text-sm border-none outline-none ml-2 w-full font-medium"
                                value={search}
                                onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}}
                                placeholder="Search..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone no.</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Children</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Adults</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected End Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {paginatedRows.map((entry) => (
                                <TableRow key={entry.id} entry={entry} refreshData={refreshData} />
                            ))}
                            {paginatedRows.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-500">No overdue sessions found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {paginatedRows.map((entry) => (
                    <MobileSessionCard key={entry.id} entry={entry} refreshData={refreshData} />
                ))}
                {paginatedRows.length === 0 && <div className="text-center p-8 text-slate-500">No overdue sessions found</div>}
            </div>

            {filteredRows.length > 0 && (
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-4">
                    <span className="text-sm text-slate-500">
                        Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredRows.length)} of {filteredRows.length} entries
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50">Previous</button>
                        <div className="flex gap-1">
                            {getPageNumbers().map((pageNum) => (
                                <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 flex items-center justify-center text-sm rounded border ${pageNum === currentPage ? 'bg-red-600 text-white border-red-600' : 'border-slate-300 hover:bg-slate-100'}`}>{pageNum}</button>
                            ))}
                        </div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}