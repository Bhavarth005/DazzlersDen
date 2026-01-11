import { Entry, APIResponse } from './types';


const MOCK_DB: Entry[] = Array.from({ length: 55 }).map((_, i) => ({
  id: `#ENTRY-${892 - i}`,
  customerName: i % 2 === 0 ? "Alice Bob" : `Customer ${i}`,
  initials: "AB",
  phoneNumber: "+91 98765 43210",
  startTimeDate: "Oct 24, 2023",
  startTime: "14:30",
  endTimeDate: i % 5 === 0 ? "--" : "Oct 24, 2023",
  endTime: i % 5 === 0 ? "--" : "16:45",
  duration: i % 5 === 0 ? "Running" : "1h 15m",
  status: i % 5 === 0 ? "IN PROGRESS" : (i % 3 === 0 ? "OVERDUE" : "COMPLETED"),
  avatarColor: "indigo",
  expectedEndTime: "16:30",
  children: 1,
  adults: 1,
  actualCost: 500,
  // Adding likely candidates for "and 2 more" (safely ignored if not in type)
  discountedCost: 500, 
  discountReason: "None",
  discountPercentage: 0
}));

export async function fetchEntries(
  page: number,
  search: string,
  limit: number
): Promise<APIResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Filter (Backend Logic)
      const filtered = MOCK_DB.filter(entry =>
        entry.customerName.toLowerCase().includes(search.toLowerCase()) ||
        entry.id.toLowerCase().includes(search.toLowerCase())
      );

      // 2. Paginate (Backend Logic)
      const start = (page - 1) * limit;
      const end = start + limit;
      const data = filtered.slice(start, end);

      resolve({
        data,
        totalPages: Math.ceil(filtered.length / limit),
        totalItems: filtered.length
      });
    }, 600); 
  });
}