"use client";

import React, { useState } from "react";
import { TreasuryState } from "@/types/cards";
import { Wallet, Landmark, DollarSign, TrendingUp, ChevronDown, ChevronUp, PlusCircle } from "lucide-react";

interface Props {
  treasury: TreasuryState;
  onUpdateTreasury: (newTreasury: TreasuryState) => void;
  totalProfitLYD: number;
}

export function TreasuryHeader({ treasury, onUpdateTreasury, totalProfitLYD }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddFundModal, setShowAddFundModal] = useState(false);
  const [fundAccount, setFundAccount] = useState<string>("cash");
  const [fundAmount, setFundAmount] = useState<string>("");
  const [operationType, setOperationType] = useState<"add" | "set">("add");

  const totalBankBalances = treasury.bankAccounts.reduce((acc, b) => acc + b.balanceLYD, 0);
  const totalLiquidLYD = treasury.cashVaultLYD + totalBankBalances;

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt < 0) return;

    if (fundAccount === "cash") {
      onUpdateTreasury({
        ...treasury,
        cashVaultLYD: operationType === "set" ? amt : treasury.cashVaultLYD + amt,
      });
    } else if (fundAccount === "dollar") {
      onUpdateTreasury({
        ...treasury,
        dollarVaultUSD: operationType === "set" ? amt : treasury.dollarVaultUSD + amt,
      });
    } else {
      onUpdateTreasury({
        ...treasury,
        bankAccounts: treasury.bankAccounts.map((b) =>
          b.id === fundAccount
            ? { ...b, balanceLYD: operationType === "set" ? amt : b.balanceLYD + amt }
            : b
        ),
      });
    }

    setFundAmount("");
    setShowAddFundModal(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Top Main Cards */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
              💎
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                خزائن ومصارف المشروع (موقف السيولة اللحظي)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                متابعة حركة النقدية بالدينار الليبي وخزينة العملة الصعبة بالدولار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddFundModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              تغذية / تعديل رصيد
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition"
            >
              تفاصيل البنوك ({treasury.bankAccounts.length})
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 4 Main KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Cash Vault LYD */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">خزينة الكاش (دينار)</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-emerald-400 font-mono">
              {treasury.cashVaultLYD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-xs text-slate-400 mr-1 font-sans">د.ل</span>
            </div>
          </div>

          {/* 2. Total Bank Balances LYD */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">إجمالي المصارف (دينار)</span>
              <Landmark className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-blue-400 font-mono">
              {totalBankBalances.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-xs text-slate-400 mr-1 font-sans">د.ل</span>
            </div>
          </div>

          {/* 3. Dollar Vault USD */}
          <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-3 sm:p-4 bg-gradient-to-b from-amber-500/10 to-transparent">
            <div className="flex items-center justify-between text-amber-300 mb-1">
              <span className="text-xs font-medium">خزينة الدولار النقدي (الخارج)</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-amber-400 font-mono">
              ${treasury.dollarVaultUSD.toLocaleString("en-US")}
              <span className="text-xs text-amber-300/80 mr-1 font-sans">USD</span>
            </div>
          </div>

          {/* 4. Total Realized Profit */}
          <div className="bg-slate-800/80 border border-purple-500/30 rounded-xl p-3 sm:p-4 bg-gradient-to-b from-purple-500/10 to-transparent">
            <div className="flex items-center justify-between text-purple-300 mb-1">
              <span className="text-xs font-medium">صافي الأرباح المحققة</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-purple-300 font-mono">
              {totalProfitLYD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-xs text-purple-200/80 mr-1 font-sans">د.ل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Bank Balances */}
      {isExpanded && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-600 mb-3">
            توزيع أرصدة الحسابات المصرفية بالدينار الليبي:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {treasury.bankAccounts.map((b) => (
              <div key={b.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-xs font-medium text-slate-700 truncate" title={b.name}>
                  {b.name}
                </div>
                <div className="text-sm font-bold text-slate-900 font-mono mt-1">
                  {b.balanceLYD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  <span className="text-xs text-slate-500 mr-1 font-sans">د.ل</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fund Modal */}
      {showAddFundModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">تغذية / تعديل رصيد الخزينة</h3>
            <p className="text-xs text-slate-500 mb-4">
              إضافة مبالغ تمويلية جديدة إلى خزينة الكاش، أو أحد المصارف، أو خزينة الدولار
            </p>
            <form onSubmit={handleAddFunds} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOperationType("add")}
                  className={`py-1.5 text-xs font-bold rounded-md transition ${
                    operationType === "add"
                      ? "bg-white text-emerald-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ➕ إضافة رصيد (تغذية)
                </button>
                <button
                  type="button"
                  onClick={() => setOperationType("set")}
                  className={`py-1.5 text-xs font-bold rounded-md transition ${
                    operationType === "set"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ✏️ ضبط الرصيد الفعلي
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  اختر الخزينة / الحساب
                </label>
                <select
                  value={fundAccount}
                  onChange={(e) => setFundAccount(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">خزينة الكاش (دينار ليبي)</option>
                  <option value="dollar">خزينة الدولار النقدي (الخارج)</option>
                  {treasury.bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (دينار)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {operationType === "set" ? "الرصيد الفعلي الجديد" : "المبلغ المراد إضافته"}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  required
                  placeholder={operationType === "set" ? "مثال: 0 أو 50000" : "مثال: 50000"}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFundModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-xs"
                >
                  {operationType === "set" ? "تأكيد ضبط الرصيد" : "تأكيد الإضافة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
