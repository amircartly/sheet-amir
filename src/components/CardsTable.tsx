"use client";

import React, { useState } from "react";
import { BankCardRecord, CardStatus } from "@/types/cards";
import {
  Search,
  Filter,
  Send,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Eye,
  KeyRound,
} from "lucide-react";

interface Props {
  cards: BankCardRecord[];
  onEditCard: (card: BankCardRecord) => void;
  onDeleteCard: (id: string) => void;
  onAdvanceStatus: (card: BankCardRecord, nextStatus: CardStatus) => void;
  onOpenSendModal: (card: BankCardRecord) => void;
  onOpenSettleModal: (card: BankCardRecord) => void;
}

export function CardsTable({
  cards,
  onEditCard,
  onDeleteCard,
  onAdvanceStatus,
  onOpenSendModal,
  onOpenSettleModal,
}: Props) {
  const [activeStage, setActiveStage] = useState<string>("الكل");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  const stages = [
    { label: "الكل", count: cards.length },
    { label: "محجوزة", count: cards.filter((c) => c.status === "محجوزة").length },
    { label: "مودعة", count: cards.filter((c) => c.status === "مودعة").length },
    { label: "انتظار الشحن", count: cards.filter((c) => c.status === "انتظار الشحن").length },
    { label: "مشحونة", count: cards.filter((c) => c.status === "مشحونة").length },
    { label: "مرسلة للسحب", count: cards.filter((c) => c.status === "مرسلة للسحب").length },
    { label: "تم السحب والتصفية", count: cards.filter((c) => c.status === "تم السحب والتصفية").length },
  ];

  const filteredCards = cards.filter((c) => {
    const matchesStage = activeStage === "الكل" || c.status === activeStage;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      c.customerName.toLowerCase().includes(q) ||
      c.nationalId.includes(q) ||
      c.cardPin.includes(q) ||
      (c.pinDollar && c.pinDollar.includes(q)) ||
      c.cblPhone.includes(q) ||
      c.cardNumber.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""));
    return matchesStage && matchesSearch;
  });

  const getStatusBadge = (status: CardStatus) => {
    switch (status) {
      case "محجوزة":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "مودعة":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "انتظار الشحن":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "مشحونة":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "مرسلة للسحب":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "تم السحب والتصفية":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const togglePin = (id: string) => {
    setShowPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Search & Filter Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              سجل البطاقات الموحد ومتابعة المراحل ({filteredCards.length} بطاقة)
            </h3>
            <p className="text-xs text-slate-500">
              بحث فوري بثلاثة معايير: بالاسم، الرقم الوطني، أو الرقم السري للبطاقة
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الوطني، PIN..."
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl pr-9 pl-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stage Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {stages.map((st) => (
            <button
              key={st.label}
              onClick={() => setActiveStage(st.label)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                activeStage === st.label
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeStage === st.label ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs sm:text-sm">
          <thead className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5">كود البطاقة</th>
              <th className="p-3.5">اسم الزبون</th>
              <th className="p-3.5 text-center">المرحلة الحالية</th>
              <th className="p-3.5">الرقم الوطني / الهاتف</th>
              <th className="p-3.5">المصرف المودع به</th>
              <th className="p-3.5 text-center">الأرقام السرية</th>
              <th className="p-3.5 text-left">قيمة الإيداع</th>
              <th className="p-3.5 text-center">الإجراءات والترحيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {filteredCards.length > 0 ? (
              filteredCards.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition group">
                  {/* ID */}
                  <td className="p-3.5 font-mono font-bold text-slate-900">
                    {c.id}
                  </td>

                  {/* Customer Name */}
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{c.customerName}</div>
                    {c.notes && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]" title={c.notes}>
                        {c.notes}
                      </div>
                    )}
                  </td>

                  {/* Stage Badge */}
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                    {c.status === "مرسلة للسحب" && c.refNumber && (
                      <div className="text-[10px] font-mono text-purple-700 mt-0.5">
                        {c.refNumber} ({c.withdrawalOffice})
                      </div>
                    )}
                    {c.status === "تم السحب والتصفية" && c.netProfitLYD !== undefined && (
                      <div className="text-[11px] font-mono font-bold text-emerald-600 mt-0.5">
                        ربح: +{c.netProfitLYD.toLocaleString("en-US")} د.ل
                      </div>
                    )}
                  </td>

                  {/* National ID & Phone */}
                  <td className="p-3.5 font-mono">
                    <div className="text-slate-800">{c.nationalId}</div>
                    <div className="text-[11px] text-slate-400">{c.cblPhone}</div>
                  </td>

                  {/* Bank */}
                  <td className="p-3.5">
                    <div className="text-slate-800 font-medium">{c.bankName}</div>
                    <div className="text-[11px] text-slate-400">حجز: {c.bookingDate}</div>
                  </td>

                  {/* PINs */}
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {showPins[c.id] ? c.cardPin : "••••"}
                      </span>
                      {c.pinDollar && (
                        <span
                          className="font-mono text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded"
                          title="السري دولار"
                        >
                          {showPins[c.id] ? c.pinDollar : "••$"}
                        </span>
                      )}
                      <button
                        onClick={() => togglePin(c.id)}
                        className="text-slate-400 hover:text-slate-600"
                        title={showPins[c.id] ? "إخفاء" : "إظهار الأرقام السرية"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Deposit Amount */}
                  <td className="p-3.5 text-left font-mono font-bold text-slate-900">
                    {c.depositAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    <span className="text-[11px] text-slate-500 mr-1 font-sans">د.ل</span>
                  </td>

                  {/* Workflow Action Buttons */}
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Step Advancement Buttons */}
                      {c.status === "محجوزة" && (
                        <button
                          onClick={() => onAdvanceStatus(c, "مودعة")}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-2xs"
                        >
                          إيداع القيمة
                        </button>
                      )}

                      {c.status === "مودعة" && (
                        <button
                          onClick={() => onAdvanceStatus(c, "انتظار الشحن")}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                        >
                          طلب الشحن
                        </button>
                      )}

                      {c.status === "انتظار الشحن" && (
                        <button
                          onClick={() => onAdvanceStatus(c, "مشحونة")}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                        >
                          تأكيد شحن الدولار
                        </button>
                      )}

                      {c.status === "مشحونة" && (
                        <button
                          onClick={() => onOpenSendModal(c)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          إرسال للسحب
                        </button>
                      )}

                      {c.status === "مرسلة للسحب" && (
                        <button
                          onClick={() => onOpenSettleModal(c)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          تصفية وبيع
                        </button>
                      )}

                      {/* Edit button */}
                      <button
                        onClick={() => onEditCard(c)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800"
                        title="تعديل بيانات البطاقة"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => onDeleteCard(c.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"
                        title="حذف السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  لا توجد بطاقات مسجلة تطابق التصفية الحالية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
