import { Customer } from './types';

type Props = {
  customer: Customer;
  isSelected: boolean;
  superAdmin: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQrSend: () => void;
};

export default function CustomerMobileCard({ customer, isSelected, superAdmin, onToggle, onEdit, onDelete, onQrSend }: Props) {
  return (
    <div 
      onClick={() => {superAdmin ? onToggle() : null}}
      className={`p-4 rounded-lg shadow-sm border flex flex-col gap-4 relative cursor-pointer transition-colors
        ${isSelected 
            ? 'bg-blue-50 dark:bg-blue-900/10 border-primary/50' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}
      `}
    >
      {superAdmin &&
        <div className="absolute top-4 right-4 z-10">
          <input 
            type="checkbox" 
            checked={isSelected}
            readOnly
            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary pointer-events-none"
          />
        </div>
      }

      <div className="flex items-center justify-between pr-8">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{customer.name}</h3>
            <p className="text-xs text-slate-500">{customer.id}</p>
          </div>
        </div>
        <div className={`text-lg font-bold ${customer.balance === 0 ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>₹{customer.balance}</div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="pt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Mobile</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{customer.mobile}</span>
          </div>
        </div>
        <div className="pb-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Birthdate</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{customer.birthdate}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="flex items-center justify-start py-3 px-4 rounded-lg text-sm font-medium bg-slate-50 dark:bg-slate-800 text-green-600 border border-transparent hover:border-green-600 transition-all"
        >
          <span className="material-symbols-outlined mr-2" style={{ fontSize: '18px' }}>edit</span> Edit
        </button>
        {superAdmin &&
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex items-center justify-start py-3 px-4 rounded-lg text-sm font-medium bg-slate-50 dark:bg-slate-800 text-red-600 border border-transparent hover:border-red-600 transition-all"
          >
            <span className="material-symbols-outlined mr-2" style={{ fontSize: '18px' }}>delete</span> Delete
          </button>
        }
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onQrSend();
          }}
          className="flex items-center justify-start py-3 px-4 rounded-lg text-sm font-medium bg-slate-50 dark:bg-slate-800 text-primary border border-transparent hover:border-primary-hover transition-all"
        >
          <span className="material-symbols-outlined mr-2" style={{ fontSize: '18px' }}>qr_code</span>Resend QR Code
        </button>
      </div>
    </div>
  );
}