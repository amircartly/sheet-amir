"use client";

import React, { useState } from "react";
import { BankCardRecord, TreasuryState } from "@/types/cards";
import { Send, DollarSign, CheckCircle2, ArrowRightLeft } from "lucide-react";

interface SendToWithdrawalProps {
  card: BankCardRecord;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (refNumber: string, office: string, amountUSD: number) => void;
}

export function SendToWithdrawalModal({ card, isOpen, onClose, onConfirm }: SendToWithdrawalProps) {
  const [refNumber, setRefNumber] = useState(`TRF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [office, setOffice] = useState("مكتب إسطنبول - الفاتح");
  const [amountUSD, setAmountUSD] = useState("4000");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center gap-2.5 text-blue-600 mb-2 font-bold text-lg">
          <Send className="w-5 h-5" />
          <span>إرسال البطاقة للسحب بالخارج</span>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          إصدار رقم إشاري وتحديد مكتب الصرافة الذي ستسلم له البطاقة ({card.customerName} - {card.bankName})
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(refNumber.trim(), office.trim(), parseFloat(amountUSD) || 4000);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الرقم الإشاري (Reference No) *
            </label>
            <input
              type="text"
              required
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="مثال: TRF-IST-9921"
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم مكتب / جهة السحب *
            </label>
            <input
              type="text"
              required
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              placeholder="مكتب إسطنبول، صرافة دبي، وسيط محلي..."
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رصيد البطاقة المخصص للسحب ($ USD)
            </label>
            <input
              type="number"
              required
              value={amountUSD}
              onChange={(e) => setAmountUSD(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm"
            >
              تأكيد الإرسال للسحب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SettleAndSellProps {
  card: BankCardRecord;
  isOpen: boolean;
  onClose: () => void;
  treasury: TreasuryState;
  onConfirm: (
    usdAmount: number,
    rate: number,
    destinationVault: string
  ) => void;
}

export function SettleAndSellModal({
  card,
  isOpen,
  onClose,
  treasury,
  onConfirm,
}: SettleAndSellProps) {
  const [usdAmount, setUsdAmount] = useState((card.withdrawalAmountUSD || 4000).toString());
  const [exchangeRate, setExchangeRate] = useState("7.32");
  const [destinationVault, setDestinationVault] = useState("خزينة الكاش");

  if (!isOpen) return null;

  const totalSaleLYD = (parseFloat(usdAmount) || 0) * (parseFloat(exchangeRate) || 0);
  const netProfitLYD = totalSaleLYD - card.depositAmount;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center gap-2.5 text-emerald-600 mb-2 font-bold text-lg">
          <DollarSign className="w-5 h-5" />
          <span>تصفية البطاقة وبيع الدولار وتوريد الأرباح</span>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          إضافة الرصيد المسحوب لخزينة الدولار ثم تحويله وبيعه بسعر السوق وتوريد صافي السيولة لخزينة الدينار.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(
              parseFloat(usdAmount) || 0,
              parseFloat(exchangeRate) || 0,
              destinationVault
            );
          }}
          className="space-y-4"
        >
          {/* Card Summary Badge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">الزبون:</span>
              <strong className="text-slate-800">{card.customerName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">المصرف المودع به:</span>
              <span className="text-slate-800">{card.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">قيمة الإيداع الأصلية:</span>
              <strong className="font-mono text-slate-800">
                {card.depositAmount.toLocaleString("en-US")} د.ل
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                كمية الدولار المسحوبة ($)
              </label>
              <input
                type="number"
                required
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                سعر بيع الدولار (د.ل)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="7.32"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              خزينة توريد حصيلة البيع (دينار ليبي)
            </label>
            <select
              value={destinationVault}
              onChange={(e) => setDestinationVault(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="خزينة الكاش">خزينة الكاش (نقداً بالدرج)</option>
              {treasury.bankAccounts.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name} (حساب بنكي)
                </option>
              ))}
            </select>
          </div>

          {/* Profit Breakdown Calculation */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex justify-between text-xs text-emerald-800">
              <span>إجمالي حصيلة البيع:</span>
              <strong className="font-mono text-emerald-900">
                {totalSaleLYD.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
              </strong>
            </div>
            <div className="flex justify-between text-xs text-emerald-800">
              <span>مطروحاً منه الإيداع:</span>
              <span className="font-mono text-emerald-700">
                - {card.depositAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
              </span>
            </div>
            <div className="border-t border-emerald-200 pt-1.5 flex justify-between text-sm font-bold text-emerald-900">
              <span>صافي ربح المعاملة:</span>
              <span className="font-mono text-base text-emerald-600">
                + {netProfitLYD.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm"
            >
              تأكيد البيع والتوريد للخزينة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
