"use client";

import React, { useState, useEffect } from "react";
import { BankCardRecord, CardStatus, CustomField, TreasuryState } from "@/types/cards";
import { INITIAL_CARDS, INITIAL_TREASURY } from "@/data/initialData";
import { TreasuryHeader } from "@/components/TreasuryHeader";
import { CardInputForm } from "@/components/CardInputForm";
import { CardsTable } from "@/components/CardsTable";
import { SendToWithdrawalModal, SettleAndSellModal } from "@/components/WorkflowModals";
import { GoogleDriveSyncModal } from "@/components/GoogleDriveSyncModal";
import { Cloud, RotateCcw, Sparkles } from "lucide-react";

export default function HomePage() {
  const [cards, setCards] = useState<BankCardRecord[]>([]);
  const [treasury, setTreasury] = useState<TreasuryState>(INITIAL_TREASURY);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [editingCard, setEditingCard] = useState<BankCardRecord | null>(null);

  // Modals state
  const [cardToSend, setCardToSend] = useState<BankCardRecord | null>(null);
  const [cardToSettle, setCardToSettle] = useState<BankCardRecord | null>(null);
  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedCards = localStorage.getItem("amir_bank_cards");
      const savedTreasury = localStorage.getItem("amir_treasury");
      const savedFields = localStorage.getItem("amir_custom_fields");

      if (savedCards) setCards(JSON.parse(savedCards));
      else setCards(INITIAL_CARDS);

      if (savedTreasury) setTreasury(JSON.parse(savedTreasury));
      else setTreasury(INITIAL_TREASURY);

      if (savedFields) setCustomFields(JSON.parse(savedFields));
    } catch (e) {
      setCards(INITIAL_CARDS);
      setTreasury(INITIAL_TREASURY);
    }
  }, []);

  // Sync to LocalStorage on update
  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem("amir_bank_cards", JSON.stringify(cards));
    }
  }, [cards]);

  useEffect(() => {
    localStorage.setItem("amir_treasury", JSON.stringify(treasury));
  }, [treasury]);

  useEffect(() => {
    localStorage.setItem("amir_custom_fields", JSON.stringify(customFields));
  }, [customFields]);

  // Total Realized Profits
  const totalProfitLYD = cards.reduce((acc, c) => acc + (c.netProfitLYD || 0), 0);

  // Handler: Save or Update Card
  const handleSaveCard = (
    cardData: Omit<BankCardRecord, "id" | "createdAt">,
    isDeposit: boolean,
    sourceAccount?: string
  ) => {
    if (editingCard) {
      // Update existing
      const updated = cards.map((c) =>
        c.id === editingCard.id ? { ...c, ...cardData } : c
      );
      setCards(updated);
      setEditingCard(null);
    } else {
      // Create new
      const newCard: BankCardRecord = {
        ...cardData,
        id: `CRD-${Math.floor(100 + cards.length + 1)}`,
        createdAt: new Date().toISOString(),
      };

      // If created directly as "مودعة", deduct from selected treasury account
      if (cardData.status === "مودعة" && sourceAccount) {
        deductDepositFromTreasury(cardData.depositAmount, sourceAccount);
      }

      setCards([newCard, ...cards]);
    }
  };

  // Helper to deduct deposit from treasury
  const deductDepositFromTreasury = (amount: number, source: string) => {
    if (source === "خزينة الكاش") {
      setTreasury((prev) => ({
        ...prev,
        cashVaultLYD: Math.max(0, prev.cashVaultLYD - amount),
      }));
    } else {
      setTreasury((prev) => ({
        ...prev,
        bankAccounts: prev.bankAccounts.map((b) =>
          b.name === source ? { ...b, balanceLYD: Math.max(0, b.balanceLYD - amount) } : b
        ),
      }));
    }
  };

  // Handler: Advance Card Status
  const handleAdvanceStatus = (card: BankCardRecord, nextStatus: CardStatus) => {
    if (nextStatus === "مودعة") {
      // Deduct deposit amount from default cash vault
      deductDepositFromTreasury(card.depositAmount, "خزينة الكاش");
    }

    setCards(
      cards.map((c) =>
        c.id === card.id
          ? {
              ...c,
              status: nextStatus,
              depositBank: nextStatus === "مودعة" ? c.bankName : c.depositBank,
            }
          : c
      )
    );
  };

  // Handler: Confirm Send to Withdrawal
  const handleConfirmSend = (refNumber: string, office: string, amountUSD: number) => {
    if (!cardToSend) return;
    setCards(
      cards.map((c) =>
        c.id === cardToSend.id
          ? {
              ...c,
              status: "مرسلة للسحب",
              refNumber,
              withdrawalOffice: office,
              withdrawalAmountUSD: amountUSD,
              sentDate: new Date().toISOString().split("T")[0],
            }
          : c
      )
    );
    setCardToSend(null);
  };

  // Handler: Confirm Settle & Sell USD to LYD Vault
  const handleConfirmSettleAndSell = (
    usdAmount: number,
    rate: number,
    destinationVault: string,
    refSlipNo?: string,
    withdrawalLocation?: string
  ) => {
    if (!cardToSettle) return;
    const totalSaleLYD = usdAmount * rate;
    const totalCost = cardToSettle.depositAmount + (cardToSettle.cardPrice || 0);
    const netProfitLYD = totalSaleLYD - totalCost;

    // 1. Update Card Record
    setCards(
      cards.map((c) =>
        c.id === cardToSettle.id
          ? {
              ...c,
              status: "تم السحب والتصفية",
              refNumber: refSlipNo || c.refNumber,
              withdrawalOffice: withdrawalLocation || c.withdrawalOffice,
              usdSoldAmount: usdAmount,
              exchangeRateLYD: rate,
              saleDestinationVault: destinationVault,
              totalSaleLYD,
              netProfitLYD,
              completedDate: new Date().toISOString().split("T")[0],
            }
          : c
      )
    );

    // 2. Financial Treasury Movement:
    // - Add USD to Dollar Vault (temporarily or tracking)
    // - Sell USD: subtract USD from Dollar Vault
    // - Add LYD proceeds to selected vault (Cash or Bank)
    setTreasury((prev) => {
      let updatedCash = prev.cashVaultLYD;
      let updatedBanks = [...prev.bankAccounts];

      if (destinationVault === "خزينة الكاش") {
        updatedCash += totalSaleLYD;
      } else {
        updatedBanks = updatedBanks.map((b) =>
          b.name === destinationVault
            ? { ...b, balanceLYD: b.balanceLYD + totalSaleLYD }
            : b
        );
      }

      return {
        ...prev,
        cashVaultLYD: updatedCash,
        bankAccounts: updatedBanks,
      };
    });

    setCardToSettle(null);
  };

  const handleResetDemoData = () => {
    if (confirm("هل تريد استعادة البيانات الافتراضية التجريبية؟")) {
      setCards(INITIAL_CARDS);
      setTreasury(INITIAL_TREASURY);
      setCustomFields([]);
      localStorage.removeItem("amir_bank_cards");
      localStorage.removeItem("amir_treasury");
      localStorage.removeItem("amir_custom_fields");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Brand Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-md border border-slate-800">
            A
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              منظومة بطاقات مصرفية (AMIR أمير)
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                إدارة دورة حياة البطاقات والخزائن
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              حجز مخصصات الأفراد، الإيداع، الشحن، السحب، وربط خزائن الدينار والدولار
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDriveModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <Cloud className="w-4 h-4" />
            دليل Google Drive و Sheets
          </button>
          <button
            onClick={handleResetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs sm:text-sm font-medium transition"
            title="إعادة تعيين البيانات التجريبية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            استعادة النموذج
          </button>
        </div>
      </div>

      {/* 1. Treasury Balances (Real Time Cash & Banks & Dollar) */}
      <TreasuryHeader
        treasury={treasury}
        onUpdateTreasury={setTreasury}
        totalProfitLYD={totalProfitLYD}
      />

      {/* 2. Main Card Input Form (10 Fields + Custom Extensible Fields + Anti-Duplicate Alert) */}
      <CardInputForm
        onSaveCard={handleSaveCard}
        existingCards={cards}
        customFieldsList={customFields}
        onAddCustomField={(f) => setCustomFields([...customFields, f])}
        editingCard={editingCard}
        onCancelEdit={() => setEditingCard(null)}
        treasury={treasury}
      />

      {/* 3. Cards Table & Multi-Criteria Search & Stage Workflow */}
      <CardsTable
        cards={cards}
        onEditCard={(c) => {
          setEditingCard(c);
          window.scrollTo({ top: 180, behavior: "smooth" });
        }}
        onDeleteCard={(id) => {
          if (confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
            setCards(cards.filter((c) => c.id !== id));
          }
        }}
        onAdvanceStatus={handleAdvanceStatus}
        onOpenSendModal={(c) => setCardToSend(c)}
        onOpenSettleModal={(c) => setCardToSettle(c)}
      />

      {/* Workflow Modals */}
      {cardToSend && (
        <SendToWithdrawalModal
          card={cardToSend}
          isOpen={!!cardToSend}
          onClose={() => setCardToSend(null)}
          onConfirm={handleConfirmSend}
        />
      )}

      {cardToSettle && (
        <SettleAndSellModal
          card={cardToSettle}
          isOpen={!!cardToSettle}
          onClose={() => setCardToSettle(null)}
          treasury={treasury}
          onConfirm={handleConfirmSettleAndSell}
        />
      )}

      {/* Google Drive Guide & Export Modal */}
      <GoogleDriveSyncModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        cards={cards}
      />
    </main>
  );
}
