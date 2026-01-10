// api.ts
import { Transaction, APIResponse } from './types';

// Mock Database
const ALL_TRANSACTIONS: Transaction[] = [
  { id: "1", customerId: "#CUS-8821", date: "Oct 24, 2023", time: "14:30 PM", customerName: "Alice Boba", phoneNo: "+91 12345 12345", type: "Recharge", amount: "+₹50.00" },
  { id: "2", customerId: "#CUS-9932", date: "Oct 24, 2023", time: "11:15 AM", customerName: "Alice Bobc", phoneNo: "+91 12345 12345", type: "Deduction", amount: "-₹12.00" },
  { id: "3", customerId: "#CUS-7741", date: "Oct 23, 2023", time: "09:42 AM", customerName: "Alice Bobd", phoneNo: "+91 12345 12345", type: "Recharge", amount: "+₹100.00" },
  { id: "4", customerId: "#CUS-2029", date: "Oct 23, 2023", time: "08:10 AM", customerName: "Alice Bobe", phoneNo: "+91 12345 12345", type: "Deduction", amount: "-₹45.50" },
  { id: "5", customerId: "#CUS-2323", date: "Oct 22, 2023", time: "16:20 PM", customerName: "Alice Bobf", phoneNo: "+91 12345 12345", type: "Recharge", amount: "+₹200.00" },
  { id: "6", customerId: "#CUS-5555", date: "Oct 21, 2023", time: "10:00 AM", customerName: "John Doe", phoneNo: "+91 12345 12345", type: "Recharge", amount: "+₹500.00" },
  // ... Imagine 50 more records here ...
];

export async function fetchTransactions(
  page: number, 
  search: string, 
  limit: number
): Promise<APIResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Filter
      let filtered = ALL_TRANSACTIONS.filter(t => 
        t.customerName.toLowerCase().includes(search.toLowerCase()) ||
        t.customerId.toLowerCase().includes(search.toLowerCase())
      );

      // 2. Pagination Logic
      const start = (page - 1) * limit;
      const end = start + limit;
      const data = filtered.slice(start, end);

      resolve({
        data,
        totalPages: Math.ceil(filtered.length / limit),
        totalItems: filtered.length
      });
    }, 600); // Simulate network delay
  });
}