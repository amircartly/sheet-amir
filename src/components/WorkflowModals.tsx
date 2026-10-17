"use client";

import React, { useState } from "react";
import { BankCardRecord, TreasuryState } from "@/types/cards";
import { Send, DollarSign, CheckCircle2, ArrowRightLeft, ShieldAlert, RotateCcw, Trash2, AlertTriangle, Landmark, Wallet } from "lucide-react";

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
    destinationVault: string,
    refSlipNo?: string,
    withdrawalLocation?: string
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
  const [refSlipNo, setRefSlipNo] = useState(card.refNumber || `REF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [withdrawalLocation, setWithdrawalLocation] = useState(card.withdrawalOffice || "تركيا - إسطنبول");

  if (!isOpen) return null;

  const cardPrice = card.cardPrice || 0;
  const totalCost = card.depositAmount + cardPrice;
  const totalSaleLYD = (parseFloat(usdAmount) || 0) * (parseFloat(exchangeRate) || 0);
  const netProfitLYD = totalSaleLYD - totalCost;

  const isFormValid =
    (parseFloat(usdAmount) || 0) > 0 &&
    (parseFloat(exchangeRate) || 0) > 0 &&
    refSlipNo.trim().length > 0 &&
    withdrawalLocation.trim().length > 0 &&
    destinationVault.trim().length > 0;

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
            if (!isFormValid) return;
            onConfirm(
              parseFloat(usdAmount) || 0,
              parseFloat(exchangeRate) || 0,
              destinationVault,
              refSlipNo.trim(),
              withdrawalLocation.trim()
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
              <span className="text-slate-500">قيمة الإيداع بالمصرف:</span>
              <strong className="font-mono text-slate-800">
                {card.depositAmount.toLocaleString("en-US")} د.ل
              </strong>
            </div>
            {cardPrice > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>سعر شراء البطاقة:</span>
                <strong className="font-mono text-emerald-900">
                  {cardPrice.toLocaleString("en-US")} د.ل
                </strong>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-800 font-semibold">
              <span>إجمالي التكلفة الكلية:</span>
              <strong className="font-mono text-blue-900">
                {totalCost.toLocaleString("en-US")} د.ل
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                كمية الدولار المسحوبة ($) *
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
                سعر بيع الدولار (د.ل) *
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الرقم الإشاري (Slip / Ref No) *
              </label>
              <input
                type="text"
                required
                value={refSlipNo}
                onChange={(e) => setRefSlipNo(e.target.value)}
                placeholder="مثال: REF-9921"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                مكان ودولة السحب *
              </label>
              <input
                type="text"
                required
                value={withdrawalLocation}
                onChange={(e) => setWithdrawalLocation(e.target.value)}
                placeholder="تركيا - إسطنبول، دبي..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              خزينة توريد حصيلة البيع (دينار ليبي) *
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
            <div className="flex justify-between text-xs text-slate-600">
              <span>مطروحاً منه الإيداع:</span>
              <span className="font-mono text-slate-700">
                - {card.depositAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
              </span>
            </div>
            {cardPrice > 0 && (
              <div className="flex justify-between text-xs text-amber-700">
                <span>مطروحاً منه سعر البطاقة:</span>
                <span className="font-mono text-amber-800">
                  - {cardPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-500 border-t border-emerald-200/60 pt-1">
              <span>إجمالي التكلفة المخصومة:</span>
              <span className="font-mono text-slate-700 font-semibold">
                - {totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
              </span>
            </div>
            <div className="border-t border-emerald-200 pt-1.5 flex justify-between text-sm font-bold text-emerald-900">
              <span>صافي ربح المعاملة الحقيقي:</span>
              <span className="font-mono text-base text-emerald-600">
                + {netProfitLYD.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
              </span>
            </div>
          </div>

          {!isFormValid && (
            <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg text-center">
              🔒 زر التأكيد مقفل: يرجى كتابة الرقم الإشاري ومكان السحب وقيمة وسعر البيع لتفعيل التصفية
            </div>
          )}

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
              disabled={!isFormValid}
              className="px-4 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-sm transition-all"
            >
              تأكيد البيع والتوريد للخزينة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ResetSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (newTreasury: TreasuryState) => void;
  currentTreasury: TreasuryState;
}

export function ResetSystemModal({
  isOpen,
  onClose,
  onConfirmReset,
  currentTreasury,
}: ResetSystemModalProps) {
  const [cashLYD, setCashLYD] = useState("0");
  const [dollarUSD, setDollarUSD] = useState("0");
  const [bankBalances, setBankBalances] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    currentTreasury.bankAccounts.forEach((b) => {
      map[b.id] = "0";
    });
    return map;
  });
  const [pinCode, setPinCode] = useState("");

  if (!isOpen) return null;

  const isPinValid = pinCode.trim() === "9999" || pinCode.trim().toLowerCase() === "تصفير";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPinValid) return;

    const newTreasury: TreasuryState = {
      cashVaultLYD: parseFloat(cashLYD) || 0,
      dollarVaultUSD: parseFloat(dollarUSD) || 0,
      bankAccounts: currentTreasury.bankAccounts.map((b) => ({
        ...b,
        balanceLYD: parseFloat(bankBalances[b.id]) || 0,
      })),
    };

    onConfirmReset(newTreasury);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2.5 text-red-600 mb-2 font-bold text-lg">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <span>تصفير المنظومة والبدء الفعلي النظيف</span>
        </div>

        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl mb-4 leading-relaxed">
          <strong>⚠️ تنبيه إداري هام:</strong> سيقوم هذا الإجراء بمسح كافة المعاملات والبطاقات التجريبية نهائياً ليصبح عدد البطاقات <strong>(0)</strong>، وتصفير صافي الأرباح المحققة، وتهيئة الخزائن للأرصدة الافتتاحية الحقيقية.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>تحديد الأرصدة الافتتاحية الفعلية للخزائن (يمكن تركها 0):</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  رصيد كاش الدينار الافتتاحي (د.ل)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cashLYD}
                  onChange={(e) => setCashLYD(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono bg-white focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  رصيد كاش الدولار الافتتاحي ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={dollarUSD}
                  onChange={(e) => setDollarUSD(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono bg-white focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <label className="block text-[11px] font-semibold text-slate-600 mb-2">
                أرصدة الحسابات المصرفية الافتتاحية (د.ل):
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {currentTreasury.bankAccounts.map((b) => (
                  <div key={b.id} className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block truncate" title={b.name}>
                      {b.name}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={bankBalances[b.id] || "0"}
                      onChange={(e) =>
                        setBankBalances({ ...bankBalances, [b.id]: e.target.value })
                      }
                      className="w-full text-xs border border-slate-200 rounded p-1 font-mono mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              رمز تفويض الإدارة لتأكيد التصفير *
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5">
              اكتب رمز PIN للمدير العام (<strong>9999</strong>) أو اكتب كلمة (<strong>تصفير</strong>) لتأكيد العملية:
            </p>
            <input
              type="text"
              required
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="اكتب 9999 أو كلمة تصفير هنا"
              className="w-full text-sm border-2 border-red-300 rounded-lg p-2.5 font-bold text-center focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              إلغاء التراجع
            </button>
            <button
              type="submit"
              disabled={!isPinValid}
              className="px-4 py-2 text-xs sm:text-sm bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              تأكيد تصفير المنظومة والبدء الفعلي
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
