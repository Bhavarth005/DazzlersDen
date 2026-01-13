"use client"

import { useState, useEffect } from "react";
import { X, Loader2, Search, AlertCircle, Sparkles } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { toast } from "sonner";

const ONE_HR_PRICE = 500;
const TWO_HR_PRICE = 700;
const ADULT_PRICE = 100;

// Types
type Customer = {
  id: number;
  name: string;
  mobileNumber: string;
  birthdate: string;
  currentBalance: number;
  qrCodeUuid: string;
};

type Offer = {
  id: number;
  triggerAmount: number;
  bonusAmount: number;
  description: string | null;
  isActive: boolean;
};

export default function NewEntry() {
  // --- Data State ---
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]); // Store offers here
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- UI State ---
  const [selectedPlan, setSelectedPlan] = useState("1hr");
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isInsufficientBalanceModalOpen, setIsInsufficientBalanceModalOpen] = useState(false);

  // --- Recharge State ---
  const [inputBalance, setInputBalance] = useState("");
  const [paymentType, setPaymentType] = useState("CASH");
  const [isRecharging, setIsRecharging] = useState(false);

  // --- Session Input State ---
  const [kidsCount, setKidsCount] = useState("");
  const [adultsCount, setAdultsCount] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  // --- Calculation Logic for Session ---
  const kidPrice = selectedPlan === "1hr" ? ONE_HR_PRICE : TWO_HR_PRICE;
  const adultPrice = ADULT_PRICE;

  const numKids = parseInt(kidsCount) || 0;
  const numAdults = parseInt(adultsCount) || 0;
  const discPercent = parseFloat(discountPercent) || 0;

  // First 2 adults free
  const chargeableAdults = Math.max(0, numAdults - 2);

  const totalKidsCost = numKids * kidPrice;
  const totalAdultsCost = chargeableAdults * adultPrice;
  const subtotal = totalKidsCost + totalAdultsCost;

  const discountAmount = Math.round((subtotal * discPercent) / 100);
  const finalTotal = subtotal - discountAmount;

  // --- Calculation Logic for Recharge ---
  const balanceToAdd = parseFloat(inputBalance) || 0;

  // Find active offer matching the exact input amount
  const activeOffer = offers.find(
    (o) => o.isActive && o.triggerAmount === balanceToAdd
  );
  const appliedBonus = activeOffer ? activeOffer.bonusAmount : 0;
  const totalBalanceCredit = balanceToAdd + appliedBonus;


  // --- Effects ---
  // Fetch Offers on Mount
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch('/api/admin/offers', {
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          setOffers(data);
        }
      } catch (error) {
        console.error("Failed to fetch offers", error);
      }
    };
    fetchOffers();
  }, []);

  // --- API Integrations ---

  const searchCustomer = async (query: string) => {
    if (!query) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${query}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setCustomer(data[0]);
          setSearchQuery("");
        } else {
          toast.error("No customer found!")
        }
      } else {
        toast.error("Error fetching customer!")
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error!")
    } finally {
      setIsLoading(false);
    }
  };

  const searchCustomerByUUID = async (uuid: string) => {
    console.log(`Searching by UUID ${uuid}`)
    if (!uuid) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers/by-uuid/?uuid=${uuid}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setCustomer(data);
          setSearchQuery("");
        } else {
          toast.error("No customer found!")
        }
      } else {
        toast.error("Error fetching customer!")
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error!")
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = (rawValue: string) => {
    setIsQrModalOpen(false);
    searchCustomerByUUID(rawValue);
  };

  const handleRecharge = async () => {
    if (!customer || !inputBalance) return;

    setIsRecharging(true);
    try {
      const amount = parseFloat(inputBalance);
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          customerId: customer.id,
          amount: amount,
          transactionType: "RECHARGE",
          paymentMode: paymentType
        })
      });

      const data = await res.json();
      console.log(data);
      if (res.ok) {
        toast.success("Recharge successful!");
        setCustomer(prev => prev ? { ...prev, currentBalance: data.new_balance } : null);
        setIsBalanceModalOpen(false);
        setInputBalance("");
      } else {
        alert(data.detail || "Recharge failed");
      }
    } catch (error) {
      alert("An error occurred during recharge");
    } finally {
      setIsRecharging(false);
    }
  };

  const handleStartSession = async () => {
    if (!customer) {
      alert("Please select a customer first.");
      return;
    }

    if (customer.currentBalance < finalTotal) {
      setIsInsufficientBalanceModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const duration = selectedPlan === "1hr" ? 1 : 2;

      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code_uuid: customer.qrCodeUuid,
          children: numKids,
          adults: numAdults,
          duration_hr: duration,
          actual_cost: subtotal,
          discounted_cost: finalTotal,
          discount_percentage: discPercent,
          discount_reason: discountReason || "N/A"
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Session started successfully!");
        setCustomer(null);
        setKidsCount("");
        setAdultsCount("");
      } else {
        alert(data.detail || "Failed to start session");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-lg bg-white mx-auto dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Start New Session</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Scan customer or enter ID manually</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full text-primary">
            <span className="material-symbols-outlined">person_add</span>
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-8 overflow-y-scroll h-[calc(100vh-200px)]">

          {/* Search & Scan Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Find Customer</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="(ONLY FOR DEV) Mobile / Name / ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchCustomer(searchQuery)}
                  className="w-full h-16 pl-4 pr-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <button
                  onClick={() => searchCustomer(searchQuery)}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-primary transition-colors">
                  {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                </button>
              </div>

              <button
                // onClick={() => setIsQrModalOpen(true)}
                onClick={() => setIsQrModalOpen(true)}
                className="h-16 w-16 flex items-center justify-center bg-primary hover:bg-primary-hover dark:bg-gray-700 dark:hover:bg-gray-600 text-white dark:text-white font-medium rounded-lg border border-slate-300 dark:border-gray-600 transition-colors"
                title="Scan QR Code"
              >
                <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
              </button>
            </div>
          </div>

          {/* Customer Details Card */}
          {customer ? (
            <div className="bg-slate-50 dark:bg-gray-900/50 rounded-lg p-5 border border-slate-200 dark:border-gray-700 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Customer Details</h4>
                <button onClick={() => setCustomer(null)} className="text-xs text-red-500 hover:underline">Clear</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{customer.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Contact</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{customer.mobileNumber}</p>
                </div>
                <div className="border-0 lg:border-l border-slate-200 dark:border-gray-700 lg:pl-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Balance</p>
                  <p className={`text-2xl font-bold ${customer.currentBalance < finalTotal ? 'text-red-500' : 'text-primary'}`}>
                    ₹{customer.currentBalance}
                  </p>

                  <button
                    onClick={() => setIsBalanceModalOpen(true)}
                    className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:border-primary hover:text-primary dark:hover:text-primary transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Balance
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
              <p>Search or Scan a customer to begin</p>
            </div>
          )}

          {/* Form Controls */}
          <div className={`flex flex-col gap-8 transition-opacity ${!customer ? 'opacity-50 pointer-events-none' : ''}`}>

            {/* Select People */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select People</label>
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-semibold text-slate-700 dark:text-white">Kids</p>
                <input
                  value={kidsCount}
                  onChange={(e) => setKidsCount(e.target.value)}
                  className="w-32 px-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="0" type="number" min="0" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-semibold text-slate-700 dark:text-white">Adults</p>
                <input
                  value={adultsCount}
                  onChange={(e) => setAdultsCount(e.target.value)}
                  className="w-32 px-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="0" type="number" min="0" />
              </div>
              <p className="text-xs text-slate-500 text-right">
                First 2 adults free, then ₹100/adult
              </p>
            </div>

            {/* Session Plan */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Session Plan</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative cursor-pointer group">
                  <input
                    className="peer sr-only"
                    name="plan"
                    type="radio"
                    value="1hr"
                    checked={selectedPlan === "1hr"}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                  />
                  <div
                    className="p-4 rounded-xl border-2 border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 peer-checked:border-primary peer-checked:bg-primary/5 transition-all h-full flex flex-col gap-2 hover:border-primary/50">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">1 Hour</p>
                      <p className="text-sm text-slate-500 font-medium">₹{ONE_HR_PRICE}</p>
                    </div>
                  </div>
                </label>
                <label className="relative cursor-pointer group">
                  <input
                    className="peer sr-only"
                    name="plan"
                    type="radio"
                    value="2hr"
                    checked={selectedPlan === "2hr"}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                  />
                  <div
                    className="p-4 rounded-xl border-2 border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 peer-checked:border-primary peer-checked:bg-primary/5 transition-all h-full flex flex-col gap-2 hover:border-primary/50">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">2 Hours</p>
                      <p className="text-sm text-slate-500 font-medium">₹{TWO_HR_PRICE}</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Discount */}
            <div className="flex flex-col gap-4 lg:gap-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Discount</label>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 lg:gap-4">
                <p className="text-lg font-semibold text-slate-700 dark:text-white">Discount %</p>
                <input
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full lg:w-32 px-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="0" type="number" min="0" max="100" />
              </div>
              <div className="flex items-start flex-col justify-between gap-2 lg:gap-4 lg:flex-row lg:items-center">
                <p className="text-lg font-semibold text-slate-700 dark:text-white">Reason</p>
                <input
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full lg:w-64 px-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="Optional" type="text" />
              </div>
            </div>

            {/* Charge Breakdown */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Charge Breakdown</label>

              {/* Kids Row */}
              <div className="flex justify-between text-lg font-medium text-slate-700 dark:text-slate-300">
                <p>{numKids} Kids &times; ₹{kidPrice}</p>
                <p>₹{totalKidsCost}</p>
              </div>

              {/* Adults Row */}
              <div className="flex justify-between text-lg font-medium text-slate-700 dark:text-slate-300">
                <p>
                  {numAdults} Adults
                  <span className="text-sm text-slate-500 ml-1 font-normal">
                    ({chargeableAdults} chargeable)
                  </span>
                </p>
                <p>₹{totalAdultsCost}</p>
              </div>

              {/* Subtotal */}
              <div className="flex justify-between text-lg font-medium text-slate-700 dark:text-slate-300 pt-4 mt-2 border-0 border-t border-gray-300 dark:border-gray-600">
                <p>Subtotal</p>
                <p>₹{subtotal}</p>
              </div>

              {/* Discount */}
              <div className="flex justify-between text-lg font-medium text-slate-700 dark:text-slate-300">
                <p>Discount {discPercent > 0 && `(${discPercent}%)`}</p>
                <p className="text-red-500">-₹{discountAmount}</p>
              </div>

              {/* Total */}
              <div className="flex justify-between text-lg font-medium text-slate-700 dark:text-slate-300 pt-4 mt-2 border-0 border-t border-gray-300 dark:border-gray-600">
                <p>Total</p>
                <p>₹{finalTotal}</p>
              </div>
            </div>

            <div className="pt-2 pb-8">
              <button
                onClick={handleStartSession}
                disabled={isLoading || !customer || finalTotal === 0}
                className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover text-white font-semibold h-12 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Start Session</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD BALANCE MODAL */}
      {isBalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Balance</h3>
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-6">
              {/* Amount Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amount to Add</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">₹</span>
                  <input
                    autoFocus
                    value={inputBalance}
                    onChange={(e) => setInputBalance(e.target.value)}
                    type="number"
                    placeholder="0"
                    className="w-full pl-10 pr-4 h-14 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white text-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>

              {/* NEW: Quick Select Offers */}
              {offers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-500" />
                    Available Offers
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {offers.map(offer => (
                      <button
                        key={offer.id}
                        onClick={() => setInputBalance(offer.triggerAmount.toString())}
                        className={`px-3 py-2 rounded-lg text-sm border font-medium transition-all ${parseFloat(inputBalance) === offer.triggerAmount
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 hover:border-primary/50 text-slate-600 dark:text-slate-300'
                          }`}
                      >
                        <span className="font-bold">₹{offer.triggerAmount}</span>
                        <span className="text-green-600 dark:text-green-400 ml-1">+ ₹{offer.bonusAmount}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Type Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Method</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </span>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full pl-14 pr-10 h-14 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white text-lg font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                  </select>
                  <span className="absolute flex items-center right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <span className="material-symbols-outlined">expand_more</span>
                  </span>
                </div>
              </div>

              {/* Credited Amount Display */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amount to be credited</label>
                <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Total Credit</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">₹{totalBalanceCredit}</p>
                    {appliedBonus > 0 ? (
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1 justify-end">
                        <Sparkles size={12} />
                        Includes ₹{appliedBonus} Bonus
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">No bonus applied</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecharge}
                disabled={isRecharging || !inputBalance}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isRecharging && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSUFFICIENT BALANCE MODAL */}
      {isInsufficientBalanceModalOpen && customer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500">
                <AlertCircle size={32} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Insufficient Balance</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Total Cost: <span className="font-semibold text-slate-800 dark:text-slate-200">₹{finalTotal}</span>
                  <br />
                  Current Balance: <span className="font-semibold text-red-500">₹{customer.currentBalance}</span>
                </p>
              </div>

              <div className="w-full bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                  You need to add <span className="font-bold">₹{finalTotal - customer.currentBalance}</span> more to proceed.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setIsInsufficientBalanceModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsInsufficientBalanceModalOpen(false);
                  setInputBalance((finalTotal - customer.currentBalance).toString()); // Pre-fill difference
                  setIsBalanceModalOpen(true);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-500/20 transition-all active:scale-95"
              >
                Recharge Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scan Customer QR</h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-gray-700 shadow-inner bg-slate-900 aspect-square relative">
                <Scanner
                  onScan={(result) => handleScan(result[0].rawValue)}
                  onError={(error) => console.log(error)}
                />
              </div>
              <p className="text-center text-sm text-slate-500 mt-4 dark:text-slate-400">
                Align the QR code within the frame
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-700">
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}