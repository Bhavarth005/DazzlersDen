'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // For redirection if unauthorized
import { toast } from 'sonner';

export default function NewCustomer() {
  const router = useRouter();

  // 1. State for form data and loading status
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    birthDate: '',
    paymentType: '',
    initialBalance: ''
  });

  // 2. Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Main Function to Handle API Call
  const registerCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation check
    if (!formData.fullName || !formData.mobileNumber) {
      toast.warning("Please fill in required fields");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');

      // --- DATA MAPPING ---
      // We must match the Zod Schema in src/lib/schemas.ts
      const payload: any = {
        name: formData.fullName,
        mobile_number: formData.mobileNumber,
        initial_balance: formData.initialBalance ? Number(formData.initialBalance) : 0,
        payment_mode: formData.paymentType
      };
      console.log(payload)
      // Only add birthdate if user selected one (prevents sending empty string which crashes Zod)
      if (formData.birthDate) {
        // Convert YYYY-MM-DD to ISO String for strict validation
        payload.birthdate = new Date(formData.birthDate).toISOString();
      }

      // --- API CALL ---
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // --- ERROR HANDLING ---
      if (response.status === 401) {
        toast.error("Unauthorized. Please login.");
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        // If backend sends Zod errors (array), show the first one
        if (Array.isArray(data.detail)) {
          throw new Error(data.detail[0].message || "Validation failed");
        }
        // If backend sends generic error string
        throw new Error(data.detail || "Failed to create customer");
      }

      // --- SUCCESS ---
      console.log("Customer Created:", data);
      toast.success(`Customer "${data.name}" added successfully!`);

      // Reset form
      setFormData({ fullName: '', mobileNumber: '', birthDate: '', initialBalance: '', paymentType: '' });

    } catch (error: any) {
      console.error("Failed to register customer:", error);
      toast.error(error.message || "Failed to create new user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col animate-fade-in-up">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-gray-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Customer Registration</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create a new customer profile to track credits and visits.</p>
      </div>

      <div className="p-8">
        <form onSubmit={registerCustomer} className="flex flex-col gap-8">

          {/* Row 1: Primary Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={isLoading}
                className="h-12 px-4 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none disabled:opacity-50"
                placeholder="Customer's name"
                type="text"
                required
              />
            </div>

            {/* Mobile Number */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile Number</label>
              <input
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                disabled={isLoading}
                className="h-12 px-4 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none disabled:opacity-50"
                placeholder="e.g. 9876543210"
                type="tel"
                required
              />
            </div>
          </div>

          {/* Row 2: Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date of Birth */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date of birth</label>
              <input
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                disabled={isLoading}
                className="h-12 px-4 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none disabled:opacity-50"
                type="date"
              />
            </div>

            {/* Empty div to keep grid structure if needed, or just let the next section start below. 
          For cleaner code, I'll close this grid and start a new one for Financials 
          so they stay grouped together visually. */}
          </div>

          {/* Row 3: Financial Details (Balance & Payment Mode) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Initial Balance */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Initial Balance</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">₹</span>
                <input
                  name="initialBalance"
                  value={formData.initialBalance}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none disabled:opacity-50"
                  placeholder="0"
                  type="number"
                  min="0"
                />
              </div>
            </div>

            {/* Payment Type - ADDED THIS */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Type</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-outlined text-[20px]">payments</span>
                <select
                  name="paymentType"
                  value={formData.paymentType || 'CASH'}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full h-12 pl-12 pr-4 appearance-none rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none disabled:opacity-50"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-outlined text-[20px] pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-gray-700 flex justify-start">
            <button
              type="submit"
              disabled={isLoading}
              className={`
          bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-lg shadow-md shadow-primary/20 
          transition-all active:scale-[0.98] flex items-center gap-2
          ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
        `}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Add Customer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}