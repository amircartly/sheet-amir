"use client";

import React, { useState } from "react";
import { BankCardRecord } from "@/types/cards";
import {
  Cloud,
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  FolderPlus,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cards: BankCardRecord[];
}

export function GoogleDriveSyncModal({ isOpen, onClose, cards }: Props) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadCSV = () => {
    const headers = [
      "كود البطاقة",
      "اسم الزبون الرباعي",
      "الرقم الوطني",
      "هاتف المركزي (المربوط)",
      "المصرف",
      "رقم حساب الزبون",
      "رقم الآيبان للزبون (IBAN)",
      "قيمة الإيداع (د.ل)",
      "سعر البطاقة (د.ل)",
      "إجمالي التكلفة (د.ل)",
      "تاريخ الإيداع",
      "تاريخ الحجز بالمنظومة",
      "رقم البطاقة",
      "PIN المحلي",
      "السري دولار (الدولي)",
      "تاريخ الصلاحية",
      "المرحلة الحالية للبطاقة",
      "ملاحظات وبيان المعاملة",
    ];

    const rows = cards.map((c) => [
      c.id,
      `"${c.customerName}"`,
      `"${c.nationalId}"`,
      `"${c.cblPhone}"`,
      `"${c.bankName}"`,
      `"${c.accountNumber || ""}"`,
      `"${c.iban || ""}"`,
      c.depositAmount,
      c.cardPrice || 0,
      (c.depositAmount || 0) + (c.cardPrice || 0),
      c.depositDate,
      c.bookingDate,
      `"${c.cardNumber}"`,
      `"${c.cardPin}"`,
      `"${c.pinDollar || ""}"`,
      `"${c.expiryDate}"`,
      `"${c.status}"`,
      `"${c.notes || ""}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `منظومة_بطاقات_AMIR_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAppsScript = () => {
    const script = `// كود محرك Google Apps Script لمنظومة بطاقات AMIR
function onOpen() {
  SpreadsheetApp.getUi().createMenu('💎 منظومة بطاقات AMIR')
    .addItem('🛠️ تجهيز التبويبات والمعادلات تلقائياً', 'setupSystem')
    .addToUi();
}

function setupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var master = ss.getSheetByName('بيانات_ماستر') || ss.insertSheet('بيانات_ماستر', 0);
  var headers = ['كود البطاقة', 'اسم الزبون الرباعي', 'الرقم الوطني', 'هاتف المركزي', 'المصرف', 'رقم الحساب', 'الآيبان IBAN', 'قيمة الإيداع (د.ل)', 'سعر البطاقة (د.ل)', 'إجمالي التكلفة (د.ل)', 'تاريخ الإيداع', 'تاريخ الحجز', 'رقم البطاقة', 'PIN المحلي', 'السري دولار', 'الصلاحية', 'المرحلة', 'ملاحظات'];
  master.getRange(1, 1, 1, headers.length).setValues([headers]).setBackground('#0f172a').setFontColor('#fff').setFontWeight('bold');
  master.setFrozenRows(1);
  master.setRightToLeft(true);
  SpreadsheetApp.getUi().alert('تم تجهيز وتنسيق الشيت بنجاح بـ 18 عموداً متكاملاً!');
}`;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <Cloud className="w-5 h-5 text-blue-600" />
            <span>خطة الربط مع Google Drive و Google Sheets خطوة بخطوة</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>

        {/* Step by step guide */}
        <div className="space-y-4 mb-6 text-xs sm:text-sm">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              الخطوة 1: إنشاء المجلد في Google Drive
            </h4>
            <p className="text-blue-800 text-xs leading-relaxed">
              افتح متصفحك وادخل إلى <strong>Google Drive</strong>، ثم اضغط على زر <strong>+ جديد</strong> واختر <strong>مجلد جديد</strong> وسمّه: <code>منظومة بطاقات AMIR</code>.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              الخطوة 2: إنشاء ملف Google Sheets واستيراد البيانات
            </h4>
            <p className="text-emerald-800 text-xs leading-relaxed">
              ادخل داخل المجلد، واضغط <strong>+ جديد &gt; جداول بيانات Google</strong>. يمكنك استيراد ملف الـ CSV المحمّل من هنا مباشرة من قائمة (ملف &gt; استيراد).
            </p>
          </div>

          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl">
            <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-purple-600" />
              الخطوة 3: التبويبات التلقائية الذكية (بدون نسخ يدوي)
            </h4>
            <p className="text-purple-800 text-xs leading-relaxed">
              أنشئ تبويبات للمراحل (محجوزة، مودعة، مشحونة، مرسلة للسحب)، وضع معادلة <code>FILTER</code> البسيطة لتجلب لك البطاقات تلقائياً فور تغيير حالتها!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            تحميل سجل البطاقات كملف Excel / CSV جاهز
          </button>

          <button
            onClick={copyAppsScript}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "تم نسخ كود Apps Script!" : "نسخ كود Apps Script للشيت"}
          </button>
        </div>
      </div>
    </div>
  );
}
