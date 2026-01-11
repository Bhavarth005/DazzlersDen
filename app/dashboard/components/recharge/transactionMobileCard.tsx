import { Transaction } from './types';

interface Props {
  txn: Transaction;
  isSelected: boolean;
  onToggle: () => void;
}

export default function TransactionMobileCard({ txn, isSelected, onToggle }: Props) {
  const isRecharge = txn.type === 'RECHARGE' || txn.type === "BONUS";

  return (
    <div 
        onClick={onToggle}
        className={`p-4 rounded-xl shadow-sm border flex flex-col gap-4 relative cursor-pointer transition-colors
            ${isSelected 
                ? 'bg-blue-50 dark:bg-blue-900/10 border-primary/50' 
                : 'bg-white dark:bg-[#1e2836] border-[#e7edf4] dark:border-slate-700'}
        `}
    >
      <div className="absolute top-4 right-4">
        <input 
            type="checkbox" 
            checked={isSelected}
            readOnly
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary pointer-events-none"
        />
      </div>
      
      {/* ... Content (Date, Name, Amount) ... */}
      <div className="flex justify-between items-center pr-8">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#0d141c] dark:text-white">{txn.date}</span>
          <span className="text-xs text-slate-400">{txn.time}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 py-2 border-y border-[#e7edf4] dark:border-slate-700/50">
        <div className="flex flex-col w-full gap-2">
           <div className="flex justify-between">
              <span className="font-medium text-[#0d141c] dark:text-white">{txn.customerName}</span>
              <span className="font-medium text-[#0d141c] dark:text-white">{txn.customerMobile}</span>
           </div>
           <span className="text-xs text-slate-400">ID: {txn.customerId}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
          ${isRecharge 
            ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-100 dark:border-green-500/20' 
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
          }`}>
            {txn.type}
         </span>
         <span className={`text-lg font-bold ${isRecharge ? 'text-green-600 dark:text-green-400' : 'text-[#0d141c] dark:text-white'}`}>
            ({txn.paymentMode}) ₹{txn.amount}
         </span>
      </div>
    </div>
  );
}