"use client"

import { useState } from "react";
import { X } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function NewEntry() {
    // --- State Management ---
    const [selectedPlan, setSelectedPlan] = useState("1hr");
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [inputBalance, setInputBalance] = useState("");

    // Input States for Calculations
    const [kidsCount, setKidsCount] = useState("");
    const [adultsCount, setAdultsCount] = useState("");
    const [discountPercent, setDiscountPercent] = useState("");
    const [discountReason, setDiscountReason] = useState("");

    // --- Calculation Logic ---
    const kidPrice = selectedPlan === "1hr" ? 500 : 700;
    const adultPrice = 100; // Assuming flat rate per adult based on mock data

    // Parse inputs to numbers (default to 0 if empty)
    const numKids = parseInt(kidsCount) || 0;
    const numAdults = parseInt(adultsCount) || 0;
    const discPercent = parseFloat(discountPercent) || 0;

    // Calculate Totals
    const totalKidsCost = numKids * kidPrice;
    const totalAdultsCost = numAdults * adultPrice;
    const subtotal = totalKidsCost + totalAdultsCost;
    const discountAmount = Math.round((subtotal * discPercent) / 100);
    const finalTotal = subtotal - discountAmount;

    // Balance Modal Calculation
    const [paymentType, setPaymentType] = useState("Cash");
    const balanceToAdd = parseFloat(inputBalance) || 0;
    const balanceBonus = 200;
    const totalBalanceCredit = balanceToAdd + balanceBonus;

    return (
        <>
            <div className="w-full max-w-lg bg-white mx-auto dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col animate-fade-in-up">
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
                    {/* Search Section */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Customer ID</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                <input autoFocus={false}
                                    className="w-full pl-10 pr-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="Scan QR or type ID..." type="text" />
                            </div>
                            <button
                                onClick={() => setIsQrModalOpen(true)}
                                className="h-12 w-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-white rounded-lg border border-slate-300 dark:border-gray-600 transition-colors"
                                title="Scan QR Code">
                                <span className="material-symbols-outlined">qr_code_scanner</span>
                            </button>
                        </div>
                    </div>

                    {/* Customer Details Card */}
                    <div className="bg-slate-50 dark:bg-gray-900/50 rounded-lg p-5 border border-slate-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Customer Details</h4>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">Alice Bob</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Contact</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">+91 12345 12345</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Birthdate</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">01/01/2000</p>
                            </div>
                            <div className="border-0 lg:border-l border-slate-200 dark:border-gray-700 lg:pl-6">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Balance</p>
                                <p className="text-2xl font-bold text-primary dark:text-blue-400">₹1,250</p>

                                <button
                                    onClick={() => setIsBalanceModalOpen(true)}
                                    className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:border-primary hover:text-primary dark:hover:text-primary transition-colors shadow-sm">

                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Add Balance
                                </button>
                            </div>
                        </div>
                    </div>

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
                                        <p className="text-sm text-slate-500 font-medium">₹500</p>
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
                                        <p className="text-sm text-slate-500 font-medium">₹700</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Discount */}
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Discount</label>
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-lg font-semibold text-slate-700 dark:text-white">Discount %</p>
                            <input
                                value={discountPercent}
                                onChange={(e) => setDiscountPercent(e.target.value)}
                                className="w-32 px-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                placeholder="0" type="number" min="0" max="100" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-lg font-semibold text-slate-700 dark:text-white">Reason</p>
                            <input
                                value={discountReason}
                                onChange={(e) => setDiscountReason(e.target.value)}
                                className="w-64 px-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
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
                            <p>{numAdults} Adults &times; ₹{adultPrice}</p>
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
                            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold h-12 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            <span>Start Session</span>
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
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
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                    {/* Custom Arrow Icon */}
                                    <span className="absolute flex items-center right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </span>
                                </div>
                            </div>

                            {/* Credited Amount Display */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amount to be credited</label>
                                <p className="text-lg ml-4 font-semibold">
                                    ₹{totalBalanceCredit || 0} <span className="text-slate-500 text-sm font-normal">({balanceBonus > 0 ? `+₹${balanceBonus} Bonus` : 'No Bonus'})</span>
                                </p>
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
                                className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95"
                            >
                                Confirm Add
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
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scan Customer QR</h3>
                            <button
                                onClick={() => setIsQrModalOpen(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Scanner */}
                        <div className="p-6">
                            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-gray-700 shadow-inner bg-slate-900 aspect-square relative">
                                <Scanner
                                    onScan={(result) => {
                                        setIsQrModalOpen(false)
                                        alert(result[0].rawValue)
                                    }}
                                    onError={(error) => console.log(error)}
                                />
                            </div>
                            <p className="text-center text-sm text-slate-500 mt-4 dark:text-slate-400">
                                Align the QR code within the frame
                            </p>
                        </div>

                        {/* Modal Footer */}
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