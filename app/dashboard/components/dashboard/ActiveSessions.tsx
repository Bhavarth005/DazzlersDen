'use client'

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type ActiveSession = {
    id: number;
    name: string;
    phoneNo: string;
    children: number;
    adults: number;
    startTime: string;
    endTime: string;
}

// --- Shared Exit Button Logic ---
function ExitButton({ sessionId, refreshData, fullWidth }: { sessionId: number, refreshData: () => void, fullWidth?: boolean }) {
    const [markingExit, setMarkingExit] = useState(false);

    const handleExit = async () => {
        if (!confirm("Confirm exit for this session?")) return;

        setMarkingExit(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`/api/sessions/${sessionId}/exit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success("Exit marked successfully");
                refreshData(); // Reload the dashboard data
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to mark exit");
                setMarkingExit(false); // Only reset loading on error (on success, row disappears)
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
            setMarkingExit(false);
        }
    };

    return (
        <button
            disabled={markingExit}
            onClick={handleExit}
            className={`inline-flex items-center justify-center px-3 py-1.5 border border-primary text-primary hover:bg-primary/5 hover:cursor-pointer dark:hover:bg-primary/20 rounded-lg text-sm font-semibold transition-colors disabled:text-gray-400 disabled:border-gray-400 disabled:hover:bg-transparent ${fullWidth ? 'w-full' : ''}`}
        >
            {markingExit && <Loader2 size={14} className="animate-spin mr-2" />}
            Mark Exit
        </button>
    )
}

// --- Desktop Table Row ---
function TableRow({ entry, refreshData }: { entry: ActiveSession, refreshData: () => void }) {
    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    Active
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <ExitButton sessionId={entry.id} refreshData={refreshData} />
            </td>
        </tr>
    );
}

// --- Mobile Card View ---
function MobileSessionCard({ entry, refreshData }: { entry: ActiveSession, refreshData: () => void }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                        {entry.name[0]}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{entry.name}</h3>
                        <p className="text-xs text-slate-500">{entry.phoneNo}</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    Active
                </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Start</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{entry.startTime}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">End</p>
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
                <ExitButton sessionId={entry.id} refreshData={refreshData} fullWidth />
            </div>
        </div>
    );
}

export default function ActiveSessions({ entries, refreshData }: { entries: ActiveSession[], refreshData: () => void }) {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const filteredRows = entries?.filter(row =>
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.phoneNo.includes(search)
    );

    const totalPages = filteredRows ? Math.ceil(filteredRows.length / ITEMS_PER_PAGE) : 0;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRows = filteredRows ? filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE) : [];

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
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">
                    Active Sessions ({filteredRows.length})
                </h3>
                <div className="flex gap-2 w-full lg:w-78">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg h-12 w-full">
                        <span className="material-symbols-outlined text-lg ml-4">search</span>
                        <input
                            type="text"
                            className="flex text-s border-none outline-none ml-2 w-full font-medium"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            placeholder="Search by name or phone no..."
                        />
                    </div>
                </div>
            </div>

            <div className="hidden md:block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
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
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No sessions found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
                {paginatedRows.map((entry) => (
                    <MobileSessionCard key={entry.id} entry={entry} refreshData={refreshData} />
                ))}
                {paginatedRows.length === 0 && <div className="text-center p-8 text-slate-500">No sessions found</div>}
            </div>

            {/* Pagination UI */}
            {filteredRows.length > 0 && (
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-4">
                    <span className="text-sm text-slate-500">
                        Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredRows.length)} of {filteredRows.length} entries
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50">Previous</button>
                        <div className="flex gap-1">
                            {getPageNumbers().map((pageNum) => (
                                <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 flex items-center justify-center text-sm rounded border ${pageNum === currentPage ? 'bg-primary text-white border-primary' : 'border-slate-300 hover:bg-slate-100'}`}>{pageNum}</button>
                            ))}
                        </div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}