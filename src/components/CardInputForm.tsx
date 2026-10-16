"use client";

import React, { useState, useEffect } from "react";
import { BankCardRecord, CustomField, TreasuryState } from "@/types/cards";
import {
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  CreditCard,
  User,
  Phone,
  Calendar,
  Building,
  DollarSign,
  KeyRound,
  FileText,
} from "lucide-react";

interface Props {
  onSaveCard: (card: Omit<BankCardRecord, "id" | "createdAt">, isDeposit: boolean, sourceAccount?: string) => void;
  existingCards: BankCardRecord[];
  customFieldsList: CustomField[];
  onAddCustomField: (field: CustomField) => void;
  editingCard?: BankCardRecord | null;
  onCancelEdit?: () => void;
  treasury: TreasuryState;
}

export function CardInputForm({
  onSaveCard,
  existingCards,
  customFieldsList,
  onAddCustomField,
  editingCard,
  onCancelEdit,
  treasury,
}: Props) {
  // 10 base fields + PIN
  const [customerName, setCustomerName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [cblPhone, setCblPhone] = useState("");
  const [bankName, setBankName] = useState("مصرف التجارة والتنمية");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [depositAmount, setDepositAmount] = useState("19800");
  const [cardPrice, setCardPrice] = useState("2500");
  const [depositDate, setDepositDate] = useState("2026-10-15");
  const [bookingDate, setBookingDate] = useState("2026-10-15");
  const [cardNumber, setCardNumber] = useState("");
  const [cardPin, setCardPin] = useState("");
  const [pinDollar, setPinDollar] = useState("");
  const [expiryDate, setExpiryDate] = useState("09/29");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<BankCardRecord["status"]>("إدخال البيانات");

  // Deposit funding source
  const [depositSource, setDepositSource] = useState<string>("خزينة الكاش");

  // Dynamic custom fields values
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [newFieldName, setNewFieldName] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [savedSuccessName, setSavedSuccessName] = useState<string | null>(null);

  // Populate when editing
  useEffect(() => {
    if (editingCard) {
      setCustomerName(editingCard.customerName);
      setNationalId(editingCard.nationalId);
      setCblPhone(editingCard.cblPhone);
      setBankName(editingCard.bankName);
      setAccountNumber(editingCard.accountNumber || "");
      setIban(editingCard.iban || "");
      setDepositAmount(editingCard.depositAmount.toString());
      setCardPrice(editingCard.cardPrice !== undefined ? editingCard.cardPrice.toString() : "2500");
      setDepositDate(editingCard.depositDate);
      setBookingDate(editingCard.bookingDate);
      setCardNumber(editingCard.cardNumber);
      setCardPin(editingCard.cardPin);
      setPinDollar(editingCard.pinDollar || "");
      setExpiryDate(editingCard.expiryDate);
      setNotes(editingCard.notes);
      setStatus(editingCard.status);
      setDynamicValues(editingCard.customFields || {});
    }
  }, [editingCard]);

  // Anti-Duplicate Check: Find if national ID or card number is already deposited!
  const duplicateDepositFound = React.useMemo(() => {
    if (!nationalId.trim()) return null;
    const cleanId = nationalId.trim().replace(/\s+/g, "");
    const match = existingCards.find(
      (c) =>
        c.id !== editingCard?.id &&
        (c.nationalId.trim().replace(/\s+/g, "") === cleanId ||
          (cardNumber.trim() && c.cardNumber.trim().replace(/\s+/g, "") === cardNumber.trim().replace(/\s+/g, ""))) &&
        (c.status === "مودعة" ||
          c.status === "انتظار الشحن" ||
          c.status === "مشحونة" ||
          c.status === "مرسلة للسحب" ||
          c.status === "تم السحب والتصفية")
    );
    return match;
  }, [nationalId, cardNumber, existingCards, editingCard]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("الرجاء إدخال اسم الزبون");
      return;
    }

    if (duplicateDepositFound && status === "مودعة") {
      const confirmForce = confirm(
        `تنبيه شديد: هذا الزبون (${duplicateDepositFound.customerName}) مودع القيمة مسبقاً بمصرف (${duplicateDepositFound.depositBank || duplicateDepositFound.bankName}) بتاريخ (${duplicateDepositFound.depositDate})!\n\nهل أنت متأكد تماماً من رغبتك في تكرار الإيداع؟`
      );
      if (!confirmForce) return;
    }

    const savedName = customerName.trim();

    const depAmt = parseFloat(depositAmount) || 0;
    const priceAmt = parseFloat(cardPrice) || 0;

    onSaveCard(
      {
        customerName: savedName,
        nationalId: nationalId.trim(),
        cblPhone: cblPhone.trim(),
        bankName,
        depositAmount: depAmt,
        cardPrice: priceAmt,
        totalCost: depAmt + priceAmt,
        depositDate,
        bookingDate,
        cardNumber: cardNumber.trim(),
        cardPin: cardPin.trim(),
        pinDollar: pinDollar.trim(),
        expiryDate: expiryDate.trim(),
        notes: notes.trim(),
        status,
        accountNumber: accountNumber.trim(),
        iban: iban.trim(),
        depositBank: status !== "إدخال البيانات" && status !== "محجوزة" ? bankName : undefined,
        depositAccount: status !== "إدخال البيانات" && status !== "محجوزة" ? depositSource : undefined,
        customFields: dynamicValues,
      },
      status !== "إدخال البيانات" && status !== "محجوزة",
      depositSource
    );

    setSavedSuccessName(savedName);
    setTimeout(() => {
      setSavedSuccessName(null);
    }, 4500);

    // Reset if not editing
    if (!editingCard) {
      handleReset();
    }
  };

  const handleReset = () => {
    setCustomerName("");
    setNationalId("");
    setCblPhone("");
    setAccountNumber("");
    setIban("");
    setDepositAmount("19800");
    setCardPrice("2500");
    setCardNumber("");
    setCardPin("");
    setPinDollar("");
    setNotes("");
    setDynamicValues({});
    setStatus("إدخال البيانات");
  };

  const handleAddNewCustomField = () => {
    if (!newFieldName.trim()) return;
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      name: newFieldName.trim(),
      type: "text",
    };
    onAddCustomField(newField);
    setNewFieldName("");
    setShowAddField(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {editingCard ? `تعديل بيانات البطاقة (${editingCard.id})` : "نموذج إدخال بطاقة جديدة"}
            </h3>
            <p className="text-xs text-slate-500">
              تسجيل بيانات الزبون، الحجز، التوريد، والربط بالخزائن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddField(!showAddField)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            + إضافة حقل جديد للنموذج
          </button>
          {editingCard && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      {/* DYNAMIC FIELD ADDER DRAWER */}
      {showAddField && (
        <div className="mb-5 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-blue-900">اسم الحقل الإضافي:</span>
          <input
            type="text"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="مثال: رقم جواز السفر، اسم الوسيط، نسبة العمولة..."
            className="flex-1 min-w-[200px] text-xs border border-blue-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddNewCustomField}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500"
          >
            تثبيت الحقل في الشاشة
          </button>
          <button
            type="button"
            onClick={() => setShowAddField(false)}
            className="px-2.5 py-2 text-slate-500 text-xs hover:bg-blue-100 rounded-lg"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* SUCCESS NOTIFICATION BANNER */}
      {savedSuccessName && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-900">
                ✓ تم حفظ بيانات الزبون بنجاح ({savedSuccessName})
              </div>
              <div className="text-xs text-emerald-700">
                تم ترحيل المعاملة وتحديث السجل وحفظ كافة البيانات.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccessName(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 rounded-md hover:bg-emerald-100/60"
          >
            ✕ إغلاق
          </button>
        </div>
      )}

      {/* ANTI-DUPLICATE WARNING BANNER */}
      {duplicateDepositFound && (
        <div className="mb-5 p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-900 flex items-start gap-3 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <div className="font-bold text-red-700 text-sm sm:text-base">
              ⚠️ تحذير: هذه المعاملة مودعة القيمة مسبقاً!
            </div>
            <div className="mt-1 leading-relaxed text-red-800">
              الزبون: <strong className="font-semibold">{duplicateDepositFound.customerName}</strong> (الرقم الوطني: {duplicateDepositFound.nationalId})
              لديه معاملة مسجلة بالحالة (<strong className="underline">{duplicateDepositFound.status}</strong>) بمصرف{" "}
              <strong>{duplicateDepositFound.depositBank || duplicateDepositFound.bankName}</strong> بقيمة{" "}
              <strong>{duplicateDepositFound.depositAmount.toLocaleString("en-US")} د.ل</strong> بتاريخ{" "}
              <strong>{duplicateDepositFound.depositDate}</strong>.
            </div>
            <div className="mt-1.5 text-xs text-red-600 font-medium">
              الرجاء التأكد قبل إتمام عملية الإيداع لتفادي ازدواجية الصرف وتكرار دفع القيمة لنفس المواطن.
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ROW 1: Customer Name & National ID & CBL Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. اسم الزبون الرباعي *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسم العميل الرباعي"
                className="w-full text-sm border border-slate-300 rounded-xl pr-9 pl-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. الرقم الوطني (12 خانة) *
            </label>
            <input
              type="text"
              required
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="119xxxxxxxx"
              className={`w-full text-sm border rounded-xl p-2.5 font-mono focus:ring-2 ${
                duplicateDepositFound
                  ? "border-red-400 bg-red-50 text-red-900 focus:ring-red-500"
                  : "border-slate-300 focus:ring-blue-500"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3. هاتف المركزي (المربوط) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={cblPhone}
                onChange={(e) => setCblPhone(e.target.value)}
                placeholder="091xxxxxxx"
                className="w-full text-sm border border-slate-300 rounded-xl pr-9 pl-3 py-2.5 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ROW 1.5: Bank, Account Number, IBAN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. المصرف (المصارف المعتمدة) *
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
            >
              <option value="مصرف التجارة والتنمية">مصرف التجارة والتنمية</option>
              <option value="مصرف الوحدة">مصرف الوحدة</option>
              <option value="مصرف التجاري الوطني">مصرف التجاري الوطني</option>
              <option value="مصرف الأمان">مصرف الأمان</option>
              <option value="مصرف المتوسط">مصرف المتوسط</option>
              <option value="مصرف الجمهورية">مصرف الجمهورية</option>
              <option value="المصرف الإسلامي">المصرف الإسلامي</option>
              <option value="مصرف شمال أفريقيا">مصرف شمال أفريقيا</option>
              <option value="مصرف اليقين">مصرف اليقين</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رقم حساب الزبون
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="01533010488074"
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رقم الآيبان للزبون (IBAN)
            </label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="LY00 0000 0000 ..."
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ROW 2: Deposit Amount, Card Purchase Price, Total Cost, Deposit Date */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              5. قيمة الإيداع بالمصرف (د.ل) *
            </label>
            <input
              type="number"
              step="any"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-800 mb-1">
              سعر شراء البطاقة (د.ل) *
            </label>
            <input
              type="number"
              step="any"
              value={cardPrice}
              onChange={(e) => setCardPrice(e.target.value)}
              placeholder="مثال: 2500"
              className="w-full text-sm border border-emerald-300 bg-emerald-50/40 rounded-xl p-2.5 font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-800 mb-1">
              إجمالي التكلفة الكلية (د.ل)
            </label>
            <div className="w-full text-sm border border-blue-200 bg-blue-50/60 rounded-xl p-2.5 font-mono font-bold text-blue-900 flex items-center justify-between">
              <span>{((parseFloat(depositAmount) || 0) + (parseFloat(cardPrice) || 0)).toLocaleString("en-US")}</span>
              <span className="text-xs font-normal text-blue-700">د.ل</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              6. تاريخ الإيداع
            </label>
            <input
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ROW 3: Booking Date, Card Number, Local PIN, Dollar PIN, Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              7. تاريخ الحجز بالمنظومة
            </label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              8. رقم البطاقة (16 رقم)
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4263 9811 ..."
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              9. PIN المحلي (الدينار)
            </label>
            <input
              type="text"
              value={cardPin}
              onChange={(e) => setCardPin(e.target.value)}
              placeholder="PIN"
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1">
              السري دولار (الدولي) *
            </label>
            <input
              type="text"
              value={pinDollar}
              onChange={(e) => setPinDollar(e.target.value)}
              placeholder="سري الصراف"
              className="w-full text-sm border border-blue-300 bg-blue-50/50 rounded-xl p-2.5 font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              10. الصلاحية (MM/YY)
            </label>
            <input
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              placeholder="09/29"
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ROW 4: Status Stage, Funding Source, Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              حالة ومرحلة المعاملة الآن
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BankCardRecord["status"])}
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="إدخال البيانات">1. إدخال البيانات (تسجيل أولي)</option>
              <option value="محجوزة">2. محجوزة (تم الحجز بالمركزي)</option>
              <option value="مودعة">3. مودعة (تم الإيداع المالي)</option>
              <option value="انتظار شحن">4. انتظار شحن الرصيد</option>
              <option value="مشحونة">5. مشحونة ($4,000)</option>
              <option value="مرسلة للسحب">6. مرسلة للسحب بالخارج</option>
              <option value="تم السحب والتصفية">7. تم السحب وتوريد الأرباح</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              خزينة خصم قيمة الإيداع (عند الإيداع)
            </label>
            <select
              value={depositSource}
              onChange={(e) => setDepositSource(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
            >
              <option value="خزينة الكاش">
                خزينة الكاش (رصيد: {treasury.cashVaultLYD.toLocaleString("en-US")} د.ل)
              </option>
              {treasury.bankAccounts.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name} (رصيد: {b.balanceLYD.toLocaleString("en-US")} د.ل)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              11. ملاحظات وبيان المعاملة
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اسم الوسيط، المتبقي، تفاصيل إضافية..."
              className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* CUSTOM FIELDS (EXTENSIBLE) */}
        {customFieldsList.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-600 mb-2">الحقول الإضافية المخصصة:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {customFieldsList.map((f) => (
                <div key={f.id}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{f.name}</label>
                  <input
                    type="text"
                    value={dynamicValues[f.id] || ""}
                    onChange={(e) =>
                      setDynamicValues({
                        ...dynamicValues,
                        [f.id]: e.target.value,
                      })
                    }
                    placeholder={`أدخل ${f.name}`}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-slate-50/50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs sm:text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
          >
            تفريغ الخانات
          </button>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingCard ? "حفظ التعديلات" : "ترحيل وحفظ البطاقة"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
