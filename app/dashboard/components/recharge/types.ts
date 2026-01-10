// types.ts
export type TransactionType = 'Recharge' | 'Deduction';

export type Transaction = {
  id: string;
  customerId: string;
  date: string;
  time: string;
  customerName: string;
  phoneNo: string;
  type: TransactionType;
  amount: string;
};

export type APIResponse = {
  data: Transaction[];
  totalPages: number;
  totalItems: number;
};