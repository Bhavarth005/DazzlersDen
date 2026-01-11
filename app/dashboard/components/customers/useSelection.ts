import { useState } from 'react';

export function useSelection(allItemIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Toggle one item
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Toggle Select All (for the current page or filtered view)
  const isAllSelected = allItemIds.length > 0 && selectedIds.length === allItemIds.length;
  
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allItemIds);
    }
  };

  // Helper to clear selection (e.g., after delete)
  const clearSelection = () => setSelectedIds([]);

  return {
    selectedIds,
    toggleSelection,
    isAllSelected,
    toggleSelectAll,
    clearSelection,
    setSelectedIds // export this in case you need manual control
  };
}