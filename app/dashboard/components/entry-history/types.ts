export type EntryStatus = 'COMPLETED' | 'IN PROGRESS' | 'OVERDUE';

export type Entry = {
  id: string;
  customerName: string;
  phoneNumber: string;
  
  // Time
  startTimeDate: string;
  startTime: string;
  expectedEndTime: string; // New
  endTimeDate: string;
  endTime: string;
  duration: string;
  
  // Pax
  children: number; // New
  adults: number;   // New
  
  // Billing
  actualCost: number;       // New
  discountPercentage: number; // New
  discountReason: string;   // New
  
  status: EntryStatus;
};