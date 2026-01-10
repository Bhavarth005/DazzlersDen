'use client'

import { useState } from 'react';
import { toast } from 'sonner';

export default function NewCustomer() {
  // 1. State for form data and loading status
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    birthDate: '',
    initialBalance: ''
  });

  // 2. Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Main Function to Handle API Call
  const registerCustomer = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    
    // Basic validation check
    if (!formData.fullName || !formData.mobileNumber) {
      alert("Please fill in required fields");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Preparing to send data:", formData);

      // Example API call:
      // const response = await fetch('/api/customers/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: formData.fullName,
      //     mobile: formData.mobileNumber,
      //     dob: formData.birthDate,
      //     balance: Number(formData.initialBalance)
      //   })
      // });

      // Simulate network delay for UI testing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("API Call Successful");
      toast.success("New user created!")
      // Reset form or redirect user here
      setFormData({ fullName: '', mobileNumber: '', birthDate: '', initialBalance: '' });
    } catch (error) {
      console.error("Failed to register customer:", error);
      toast.error("Failed to create new user")
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
                placeholder="e.g. +91 12345 12345" 
                type="tel" 
                required
              />
            </div>
          </div>

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
                />
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