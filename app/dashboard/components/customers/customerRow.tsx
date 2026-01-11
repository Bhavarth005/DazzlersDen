import { Customer } from './types'; // Import the type!

type Props = {
  customer: Customer;
  isSelected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function CustomerRow({ customer, isSelected, onToggle, onEdit, onDelete }: Props) {
  return (
    <tr 
      onClick={onToggle}
      className={`group transition-colors cursor-pointer 
        ${isSelected 
            ? 'bg-blue-50 dark:bg-blue-900/10' 
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
    >

      <td className="px-6 py-4">
        <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => {}} 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer align-middle"
        />
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">{customer.id}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="text-sm font-medium text-slate-900 dark:text-white">{customer.name}</div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{customer.birthdate}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{customer.mobile}</td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${customer.balance === 0 ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>₹{customer.balance}</td>

      {/* Row end btn group */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} // Stop propagation
            className="flex items-center justify-center p-2 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete()
            }} // Stop propagation
            className="flex items-center justify-center p-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}