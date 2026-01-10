export type EntryStatus = 'Completed' | 'In Progress' | 'Overdue';

export type Entry = {
  id: string;
  customerName: string;
  initials: string;
  phoneNumber: string;
  startTimeDate: string;
  startTime: string;
  endTimeDate: string;
  endTime: string;
  duration: string;
  status: EntryStatus;
  avatarColor: 'indigo' | 'pink' | 'orange' | 'purple' | 'yellow' | 'cyan';
};

export type APIResponse = {
  data: Entry[];
  totalPages: number;
  totalItems: number;
};