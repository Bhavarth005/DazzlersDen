import { Transaction } from './types';

interface Props {
  txn: Transaction;
  superAdmin: boolean;
  isSelected: boolean;
  onToggle: () => void;
}

export default function TransactionRow({ txn, isSelected, superAdmin, onToggle }: Props) {
  const isRecharge = txn.type === 'RECHARGE' || txn.type === 'BONUS';

  return (
    <tr 
        onClick={() => superAdmin ? onToggle() : null} 
        className={`group transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-700/50 
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
    >
      {superAdmin &&
        <td className="px-6 py-4">
          <input 
            type="checkbox" 
            checked={isSelected}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            onChange={() => {}}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer align-middle"
          />
        </td>
      }
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {txn.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
        {txn.date} <br />
        <span className="text-xs text-slate-400">{txn.time}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
           <span className="font-medium text-[#0d141c] dark:text-white">{txn.customerName}</span>
           <span className="text-xs text-slate-400">ID: {txn.customerId}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {txn.customerMobile}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {txn.paymentMode}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
          ${isRecharge 
            ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-100 dark:border-green-500/20' 
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
          }`}>
            <span className={`size-1.5 rounded-full ${isRecharge ? 'bg-green-500' : 'bg-slate-400'}`}></span>
            {txn.type}
        </span>
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${isRecharge ? 'text-green-600 dark:text-green-400' : 'text-[#0d141c] dark:text-white'}`}>
        ₹ {txn.amount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </td>
    </tr>
  );
}