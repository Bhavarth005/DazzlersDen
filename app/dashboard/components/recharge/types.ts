// types.ts
export type TransactionType = 'RECHARGE' | 'SESSION_DEDUCT' | 'BONUS';

export type Transaction = {
  id: string;
  customerId: string;
  date: string;
  time: string;
  customerName: string;
  customerMobile: string;
  type: TransactionType;
  paymentMode: "CASH" | "UPI";
  amount: string;
};

export type APIResponse = {
  data: Transaction[];
  totalPages: number;
  totalItems: number;
};