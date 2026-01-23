import { BirthdayCustomer } from "./types";

interface Props {
    customer: BirthdayCustomer;
    onSendMessage: () => void;
}

export default function BirthdayRow({ customer, onSendMessage }: Props) {
  return (
    <tr className="group transition-colors border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-300">
        {customer.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900 dark:text-white">{customer.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {customer.phoneNumber}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-400 text-[18px]">cake</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{customer.formattedBirthDate}</span>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
            onClick={onSendMessage}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg transition-colors text-xs font-semibold"
        >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Send Message
        </button>
      </td>
    </tr>
  );
}