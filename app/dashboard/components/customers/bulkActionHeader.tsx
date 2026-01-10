import { Dispatch, SetStateAction } from "react";


export default function BulkActionHeader({ selection, onBulkDelete }: {
    selection: {
        selectedIds: string[];
        toggleSelection: (id: string) => void;
        isAllSelected: boolean;
        clearSelection: () => void;
        setSelectedIds: Dispatch<SetStateAction<string[]>>;
    },
    onBulkDelete: () => void
}) {
    return <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700 dark:text-blue-100">
                    {selection.selectedIds.length} Selected
                </span>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={() => selection.setSelectedIds([])}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white/50 rounded-md transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={onBulkDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
            </button>
        </div>
    </div>
}