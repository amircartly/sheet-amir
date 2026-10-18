"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DEFAULT_GOOGLE_SCRIPT_URL } from "@/lib/constants";

interface BankCard {
  id: string;
  code: string;
  name: string;
  nationalId: string;
  cblPhone: string;
  bank: string;
  accountNumber: string;
  iban: string;
  depositAmt: number;
  cardPrice: number;
  totalCost: number;
  depositDate: string;
  bookingDate: string;
  cardNum: string;
  pinLocal: string;
  pinDollar: string;
  expiry: string;
  status: string;
  notes: string;
  refSlipNo?: string;
  withdrawLocation?: string;
  usdAmount?: number;
  rate?: number;
  netProfitLYD?: number;
  destinationVault?: string;
  createdAt: string;
}

interface VaultAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  totalIncome: number;
}

interface EmployeeRole {
  name: string;
  role: string;
  allowedStages: string[];
}

const DEFAULT_VAULTS: VaultAccount[] = [
  { id: "cash_lyd", name: "خزينة الكاش بالدينار", type: "خزينة نقدية (درج المكتب)", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "bank_1", name: "حساب مصرف التجارة والتنمية", type: "حساب مصرفي", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "bank_2", name: "حساب مصرف الوحدة", type: "حساب مصرفي", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "bank_3", name: "حساب المصرف التجاري الوطني", type: "حساب مصرفي", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "bank_4", name: "حساب مصرف الأمان", type: "حساب مصرفي", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "bank_5", name: "حساب مصرف المتوسط", type: "حساب مصرفي", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "bank_6", name: "حساب مصرف الجمهورية", type: "حساب مصرفي", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "bank_7", name: "حساب المصرف الإسلامي الليبي", type: "حساب مصرفي", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "bank_8", name: "حساب مصرف شمال أفريقيا", type: "حساب مصرفي", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "bank_9", name: "حساب مصرف اليقين", type: "حساب مصرفي", currency: "د.ل", balance: 0, totalIncome: 0 },
  { id: "cash_usd", name: "خزينة الدولار النقدي (الخارج)", type: "خزينة عملة صعبة (الخارج)", currency: "$", balance: 0, totalIncome: 0 },
];

const ALL_STAGES = [
  "1. إدخال البيانات",
  "2. محجوزة",
  "3. مودعة",
  "4. انتظار شحن",
  "5. مشحونة",
  "6. مرسلة للسحب",
  "7. تم السحب والتصفية",
];

const ROLES_MAP: Record<string, EmployeeRole> = {
  "1111": {
    name: "موظف الاستقبال",
    role: "موظف استقبال",
    allowedStages: ["1. إدخال البيانات", "2. محجوزة"],
  },
  "2222": {
    name: "مسؤول الإيداع والخزينة",
    role: "مسؤول إيداع وخزينة",
    allowedStages: ["1. إدخال البيانات", "2. محجوزة", "3. مودعة"],
  },
  "3333": {
    name: "المسؤول المالي ومكتب الخارج",
    role: "مسؤول مالي ومكتب الخارج",
    allowedStages: ["4. انتظار شحن", "5. مشحونة", "6. مرسلة للسحب", "7. تم السحب والتصفية"],
  },
  "9999": {
    name: "المدير العام (أمير)",
    role: "مدير عام",
    allowedStages: ALL_STAGES,
  },
};

export default function AmirClassicApp() {
  // Current active role
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeRole>(ROLES_MAP["1111"]);

  // System Database State (Stored in localStorage)
  const [cards, setCards] = useState<BankCard[]>([]);
  const [vaults, setVaults] = useState<VaultAccount[]>(DEFAULT_VAULTS);

  // Form State
  const [cardCode, setCardCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [cblPhone, setCblPhone] = useState("");
  const [bank, setBank] = useState("مصرف التجارة والتنمية");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [depositAmt, setDepositAmt] = useState<string>("0");
  const [cardPrice, setCardPrice] = useState<string>("0");
  const [depositDate, setDepositDate] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [pinLocal, setPinLocal] = useState("");
  const [pinDollar, setPinDollar] = useState("");
  const [expiry, setExpiry] = useState("09/29");
  const [status, setStatus] = useState("1. إدخال البيانات");
  const [notes, setNotes] = useState("");

  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  // UI / Status messages
  const [statusMsg, setStatusMsg] = useState("");
  const [isDepositLocked, setIsDepositLocked] = useState(false);
  const [isBookingLocked, setIsBookingLocked] = useState(false);
  const [warningHtml, setWarningHtml] = useState<string | null>(null);

  // Search & Reports bar
  const [searchQuery, setSearchQuery] = useState("");
  const [reportStage, setReportStage] = useState("1. إدخال البيانات");

  // Modals state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundVaultId, setFundVaultId] = useState("cash_lyd");
  const [fundAmount, setFundAmount] = useState("");
  const [fundMode, setFundMode] = useState<"add" | "set">("add");

  // Step 1: Settle Modal (Receive USD vs Direct Sale)
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleWorkflowMode, setSettleWorkflowMode] = useState<"step1_receive_usd" | "direct_sale_lyd">("step1_receive_usd");
  const [settleUsdAmount, setSettleUsdAmount] = useState("4000");
  const [settleRate, setSettleRate] = useState("10.00");
  const [settleRefSlipNo, setSettleRefSlipNo] = useState("");
  const [settleWithdrawLocation, setSettleWithdrawLocation] = useState("تركيا - إسطنبول");
  const [settleVault, setSettleVault] = useState("خزينة الكاش بالدينار");
  const [settleError, setSettleError] = useState("");

  // Step 2: Sell Accumulated USD Modal
  const [showSellUsdModal, setShowSellUsdModal] = useState(false);
  const [sellUsdAmount, setSellUsdAmount] = useState("4000");
  const [sellUsdRate, setSellUsdRate] = useState("10.00");
  const [sellUsdDestVault, setSellUsdDestVault] = useState("خزينة الكاش بالدينار");
  const [sellUsdRefNo, setSellUsdRefNo] = useState("");
  const [sellUsdNotes, setSellUsdNotes] = useState("");
  const [sellUsdError, setSellUsdError] = useState("");

  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: "", details: "", code: "" });

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: "", message: "", type: "warning" });

  const [showResetSystemModal, setShowResetSystemModal] = useState(false);
  const [resetPin, setResetPin] = useState("");
  const [resetCashLYD, setResetCashLYD] = useState("0");
  const [resetDollarUSD, setResetDollarUSD] = useState("0");

  // Google Sheets Live Sync State
  const [showGoogleSyncModal, setShowGoogleSyncModal] = useState(false);
  const [googleScriptUrl, setGoogleScriptUrl] = useState<string>(DEFAULT_GOOGLE_SCRIPT_URL);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [copyCodeStatus, setCopyCodeStatus] = useState<string | null>(null);
  const [showScriptGuide, setShowScriptGuide] = useState(false);

  const handleCopyScriptCode = async () => {
    setCopyCodeStatus("⏳ جاري نسخ الكود...");
    try {
      const res = await fetch("/api/google-script-code");
      if (!res.ok) throw new Error("تعذر جلب ملف الكود");
      const code = await res.text();
      await navigator.clipboard.writeText(code);
      setCopyCodeStatus("✓ تم نسخ الكود كاملاً (937 سطر)! توجه الآن إلى Apps Script في شيت جوجل والصقه.");
      setShowScriptGuide(true);
      setTimeout(() => setCopyCodeStatus(null), 9000);
    } catch (err: any) {
      setCopyCodeStatus("خطأ في النسخ: " + err.message);
      setTimeout(() => setCopyCodeStatus(null), 5000);
    }
  };

  // Sync Cards directly from Google Sheets (Central Real-Time Master Database)
  const syncCardsFromGoogleSheets = useCallback(
    async (customUrl?: string, quiet = false) => {
      const targetUrl = (customUrl || googleScriptUrl || DEFAULT_GOOGLE_SCRIPT_URL).trim();
      if (!quiet) setStatusMsg("🔄 جاري مزامنة وتحديث البيانات من شيت جوجل...");

      try {
        const res = await fetch("/api/google-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_cards",
            scriptUrl: targetUrl,
          }),
        });

        const data = await res.json();
        if (data && data.success && Array.isArray(data.cards) && data.cards.length > 0) {
          setCards(data.cards);
          localStorage.setItem("amir_cards_v2", JSON.stringify(data.cards));
          setGoogleConnected(true);
          if (!quiet) {
            setStatusMsg(`✓ تمت المزامنة بنجاح: ${data.cards.length} بطاقة مسجلة من شيت جوجل`);
            setTimeout(() => setStatusMsg(""), 3500);
          }
          return true;
        } else if (data && data.cards && Array.isArray(data.cards)) {
          setCards(data.cards);
          localStorage.setItem("amir_cards_v2", JSON.stringify(data.cards));
          setGoogleConnected(true);
          if (!quiet) {
            setStatusMsg("✓ تم الاتصال بشيت جوجل (لا توجد بطاقات مسجلة حالياً)");
            setTimeout(() => setStatusMsg(""), 3500);
          }
          return true;
        } else {
          if (!quiet) {
            setStatusMsg(data?.error || "فشل جلب البيانات من شيت جوجل");
            setTimeout(() => setStatusMsg(""), 4000);
          }
        }
      } catch (err: any) {
        if (!quiet) {
          setStatusMsg("خطأ في الاتصال بشيت جوجل: " + (err.message || ""));
          setTimeout(() => setStatusMsg(""), 4000);
        }
      }
      return false;
    },
    [googleScriptUrl]
  );

  // Export & Sync Treasury Balances to Google Sheets (أرصدة_الخزائن)
  const syncTreasuryToGoogleSheets = useCallback(
    async (customVaults?: VaultAccount[], quiet = false) => {
      const targetUrl = (googleScriptUrl || DEFAULT_GOOGLE_SCRIPT_URL).trim();
      if (!targetUrl) {
        if (!quiet) setStatusMsg("الرجاء إدخال رابط Google Apps Script أولاً");
        return false;
      }

      const vaultsToSend = customVaults || vaults;
      if (!quiet) {
        setIsSyncingGoogle(true);
        setStatusMsg("⏳ جاري تصدير ومزامنة أرصدة الخزائن إلى شيت جوجل...");
      }

      try {
        const res = await fetch("/api/google-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync_treasury",
            scriptUrl: targetUrl,
            vaults: vaultsToSend,
            employeeName: `${currentEmployee.name} (${currentEmployee.role})`,
          }),
        });

        const data = await res.json();
        if (data && data.success) {
          setGoogleConnected(true);
          if (!quiet) {
            setStatusMsg(`✓ ${data.message || "تمت مزامنة وتصدير أرصدة الخزائن إلى شيت جوجل بنجاح!"}`);
            setTimeout(() => setStatusMsg(""), 4000);
          }
          return data;
        } else {
          if (!quiet) {
            setStatusMsg(data?.error || "فشل مزامنة أرصدة الخزائن مع شيت جوجل");
            setTimeout(() => setStatusMsg(""), 6000);
          }
          return data || { success: false, error: "فشل مزامنة أرصدة الخزائن" };
        }
      } catch (err: any) {
        if (!quiet) {
          setStatusMsg("خطأ في مزامنة الخزائن: " + (err.message || ""));
          setTimeout(() => setStatusMsg(""), 4000);
        }
        return { success: false, error: err.message };
      } finally {
        if (!quiet) setIsSyncingGoogle(false);
      }
    },
    [googleScriptUrl, vaults, currentEmployee]
  );

  // Import Treasury Balances from Google Sheets (ورقة أرصدة_الخزائن)
  const importTreasuryFromGoogleSheets = useCallback(
    async (quiet = false) => {
      const targetUrl = (googleScriptUrl || DEFAULT_GOOGLE_SCRIPT_URL).trim();
      if (!targetUrl) {
        if (!quiet) setStatusMsg("الرجاء إدخال رابط Google Apps Script أولاً");
        return false;
      }

      if (!quiet) {
        setIsSyncingGoogle(true);
        setStatusMsg("⏳ جاري جلب وتحديث أرصدة الخزائن من شيت جوجل...");
      }

      try {
        const res = await fetch("/api/google-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_treasury",
            scriptUrl: targetUrl,
          }),
        });

        const data = await res.json();
        if (data && data.success && Array.isArray(data.treasury) && data.treasury.length > 0) {
          setVaults((prevVaults) => {
            const updated = prevVaults.map((v) => {
              const match = data.treasury.find((t: any) => {
                const tName = (t.accountName || "").toString().trim();
                return (
                  tName === v.name ||
                  tName.includes(v.name) ||
                  v.name.includes(tName) ||
                  (v.id === "cash_usd" && (tName.includes("الدولار") || t.currency === "$")) ||
                  (v.id === "cash_lyd" && tName.includes("الكاش"))
                );
              });
              if (match) {
                const bal =
                  typeof match.currentBalance === "number"
                    ? match.currentBalance
                    : parseFloat(match.currentBalance) || 0;
                return {
                  ...v,
                  balance: bal,
                };
              }
              return v;
            });

            localStorage.setItem("amir_vaults_v2", JSON.stringify(updated));

            fetch("/api/vaults", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "sync_all", vaults: updated }),
            }).catch((err) => console.error("Error syncing imported vaults to MySQL:", err));

            return updated;
          });

          setGoogleConnected(true);
          if (!quiet) {
            setStatusMsg("✓ تم جلب وتحديث أرصدة الخزائن من شيت جوجل بنجاح!");
            setTimeout(() => setStatusMsg(""), 4000);
          }
          return true;
        } else {
          if (!quiet) {
            setStatusMsg(data?.error || "لم يتم العثور على أرصدة خزائن في شيت جوجل");
            setTimeout(() => setStatusMsg(""), 4000);
          }
        }
      } catch (err: any) {
        if (!quiet) {
          setStatusMsg("خطأ في جلب أرصدة الخزائن: " + (err.message || ""));
          setTimeout(() => setStatusMsg(""), 4000);
        }
      } finally {
        if (!quiet) setIsSyncingGoogle(false);
      }
      return false;
    },
    [googleScriptUrl]
  );

  // Load from Google Sheets & MySQL on Mount (with localStorage fallback)
  useEffect(() => {
    let activeGoogleUrl = DEFAULT_GOOGLE_SCRIPT_URL;

    try {
      const savedRole = localStorage.getItem("amir_active_role_v2");
      if (savedRole && ROLES_MAP[savedRole]) setCurrentEmployee(ROLES_MAP[savedRole]);

      const savedCards = localStorage.getItem("amir_cards_v2");
      const savedVaults = localStorage.getItem("amir_vaults_v2");
      if (savedCards) setCards(JSON.parse(savedCards));
      if (savedVaults) {
        try {
          const parsed = JSON.parse(savedVaults);
          if (Array.isArray(parsed)) {
            const normalized = parsed.map((v: any) => {
              if (v.id === "cash_usd" || v.currency === "$" || (v.name && v.name.includes("خزينة الدولار"))) {
                return {
                  ...v,
                  id: "cash_usd",
                  name: "خزينة الدولار النقدي (الخارج)",
                  type: "خزينة عملة صعبة (الخارج)",
                  currency: "$",
                };
              }
              return v;
            });
            setVaults(normalized);
            localStorage.setItem("amir_vaults_v2", JSON.stringify(normalized));
          }
        } catch {
          // ignore
        }
      }

      const savedGoogleUrl = localStorage.getItem("amir_google_script_url");
      let activeGoogleUrl = "";
      const deadUrls = [
        "AKfycbxIOAfZttwY6NodMj9wPQ5zb7VRvCdVeN5vBftwKFNLALLYzM2LrsquQuCOaUAbn7qAiw",
        "AKfycbzCOTTsRoERt18CajK5V8Ifwnh32jb14q53AMpKGX8sE8I2HCptCvTodJDTCKeSkoJ0Lg",
        "AKfycbyNBxrs_hHrlhW7v4jRQmo6jXv9Et3d7ILybQoRmPN",
      ];
      if (
        savedGoogleUrl &&
        savedGoogleUrl.trim() &&
        !deadUrls.some((d) => savedGoogleUrl.includes(d))
      ) {
        activeGoogleUrl = savedGoogleUrl.trim();
      } else if (DEFAULT_GOOGLE_SCRIPT_URL) {
        activeGoogleUrl = DEFAULT_GOOGLE_SCRIPT_URL;
      }
      setGoogleScriptUrl(activeGoogleUrl);
      if (activeGoogleUrl) {
        localStorage.setItem("amir_google_script_url", activeGoogleUrl);
      } else {
        localStorage.removeItem("amir_google_script_url");
      }
    } catch {
      // fallback
    }

    // 1. First priority: Real-time sync with Google Sheets (Central Cloud Database)
    if (activeGoogleUrl) {
      fetch("/api/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_cards",
          scriptUrl: activeGoogleUrl,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && Array.isArray(data.cards) && data.cards.length > 0) {
            setCards(data.cards);
            localStorage.setItem("amir_cards_v2", JSON.stringify(data.cards));
            setGoogleConnected(true);
          } else {
            // 2. Fallback to MySQL cards if Google Sheets had no records yet
            fetch("/api/cards")
              .then((res) => (res.ok ? res.json() : null))
              .then((cData) => {
                if (cData && cData.success && Array.isArray(cData.cards) && cData.cards.length > 0) {
                  setCards(cData.cards);
                  localStorage.setItem("amir_cards_v2", JSON.stringify(cData.cards));
                  setDbConnected(true);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          // Fallback to MySQL cards if Google Sheets call fails
          fetch("/api/cards")
            .then((res) => (res.ok ? res.json() : null))
            .then((cData) => {
              if (cData && cData.success && Array.isArray(cData.cards) && cData.cards.length > 0) {
                setCards(cData.cards);
                localStorage.setItem("amir_cards_v2", JSON.stringify(cData.cards));
                setDbConnected(true);
              }
            })
            .catch(() => {});
        });
    } else {
      // No Google Sheets URL configured yet, load cards from database
      fetch("/api/cards")
        .then((res) => (res.ok ? res.json() : null))
        .then((cData) => {
          if (cData && cData.success && Array.isArray(cData.cards) && cData.cards.length > 0) {
            setCards(cData.cards);
            localStorage.setItem("amir_cards_v2", JSON.stringify(cData.cards));
            setDbConnected(true);
          }
        })
        .catch(() => {});
    }

    // Fetch initial vaults
    fetch("/api/vaults")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && Array.isArray(data.vaults) && data.vaults.length > 0) {
          const normalized = data.vaults.map((v: any) => {
            if (v.id === "cash_usd" || v.currency === "$" || (v.name && v.name.includes("خزينة الدولار"))) {
              return {
                ...v,
                id: "cash_usd",
                name: "خزينة الدولار النقدي (الخارج)",
                type: "خزينة عملة صعبة (الخارج)",
                currency: "$",
              };
            }
            return v;
          });
          setVaults(normalized);
          localStorage.setItem("amir_vaults_v2", JSON.stringify(normalized));
        }
      })
      .catch(() => {});
  }, []);

  // Sync to LocalStorage on update
  useEffect(() => {
    localStorage.setItem("amir_cards_v2", JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem("amir_vaults_v2", JSON.stringify(vaults));
  }, [vaults]);

  useEffect(() => {
    if (googleScriptUrl) {
      localStorage.setItem("amir_google_script_url", googleScriptUrl);
    }
  }, [googleScriptUrl]);

  // Derived Total Cost
  const totalCost = (parseFloat(depositAmt) || 0) + (parseFloat(cardPrice) || 0);

  // Derived USD Vault Helpers
  const usdVault = vaults.find((v) => v.id === "cash_usd" || v.currency === "$");
  const availableUsd = usdVault ? usdVault.balance : 0;

  // Step 1: Settle & Receive Calculations
  const settleTotalSale = (parseFloat(settleUsdAmount) || 0) * (parseFloat(settleRate) || 0);
  const settleNetProfit = settleTotalSale - totalCost;
  const isDirectSaleValid =
    (parseFloat(settleUsdAmount) || 0) > 0 &&
    (parseFloat(settleRate) || 0) > 0 &&
    settleRefSlipNo.trim().length > 0 &&
    settleWithdrawLocation.trim().length > 0 &&
    settleVault.trim().length > 0;

  const isReceiveUsdValid =
    (parseFloat(settleUsdAmount) || 0) > 0 &&
    settleRefSlipNo.trim().length > 0 &&
    settleWithdrawLocation.trim().length > 0;

  // Step 2: Sell Accumulated USD Calculations
  const sellUsdNum = parseFloat(sellUsdAmount) || 0;
  const sellRateNum = parseFloat(sellUsdRate) || 0;
  const sellTotalSaleLYD = sellUsdNum * sellRateNum;
  const remainingUsd = Math.max(0, availableUsd - sellUsdNum);
  const isSellUsdValid =
    sellUsdNum > 0 &&
    sellUsdNum <= availableUsd &&
    sellRateNum > 0 &&
    sellUsdDestVault.trim().length > 0;

  // Custom Alert Helper
  const triggerAlert = (title: string, message: string, type: "warning" | "danger" | "info" | "search" = "warning") => {
    setAlertInfo({ title, message, type });
    setShowAlertModal(true);
  };

  // Switch role handler
  const handlePinLogin = (pinToUse?: string) => {
    const pin = (pinToUse || pinInput).trim();
    if (!pin) {
      setPinError("الرجاء إدخال رمز PIN");
      return;
    }

    if (ROLES_MAP[pin]) {
      const roleObj = ROLES_MAP[pin];
      setCurrentEmployee(roleObj);
      localStorage.setItem("amir_active_role_v2", pin);

      // adjust status dropdown if current status is not permitted
      if (!roleObj.allowedStages.includes(status)) {
        setStatus(roleObj.allowedStages[0] || "1. إدخال البيانات");
      }

      setShowLoginModal(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError("رمز PIN غير صحيح. جرب 1111، 2222، 3333، أو 9999");
    }
  };

  // Evaluate Protection Rules
  const evaluateProtection = (card: Partial<BankCard>) => {
    const isAdmin = currentEmployee.role === "مدير عام";
    const depVal = card.depositAmt || 0;
    const isDeposited = (card.status && card.status !== "1. إدخال البيانات" && card.status !== "2. محجوزة") || depVal > 0;
    const isBooked = !!card.bookingDate && card.status !== "1. إدخال البيانات";

    const warnings: string[] = [];

    if (isDeposited && depVal > 0) {
      if (isAdmin) {
        setIsDepositLocked(false);
        warnings.push(`⛔ <strong>تنبيه إداري:</strong> هذه المعاملة <u>مودعة مسبقاً</u> بقيمة (${depVal.toLocaleString("en-US")} د.ل). بصفتك المدير العام؛ الخانات مفتوحة لك مباشرة.`);
      } else {
        setIsDepositLocked(true);
        warnings.push(`⛔ <strong>تحذير مالي:</strong> هذه المعاملة <u>مودعة بالفعل مسبقاً</u> بقيمة (${depVal.toLocaleString("en-US")} د.ل). تم قفل خانات الإيداع باللون الأحمر لمنع التكرار.`);
      }
    } else {
      setIsDepositLocked(false);
    }

    if (isBooked && card.bookingDate) {
      if (isAdmin) {
        setIsBookingLocked(false);
        warnings.push(`⚠️ <strong>تنبيه:</strong> هذا الزبون محجوز بالمنظومة مسبقاً بتاريخ (${card.bookingDate}).`);
      } else {
        setIsBookingLocked(true);
        warnings.push(`⚠️ <strong>تنبيه:</strong> هذا الزبون <u>محجوز له بالمنظومة مسبقاً</u> بتاريخ (${card.bookingDate}). تم قفل خانة تاريخ الحجز.`);
      }
    } else {
      setIsBookingLocked(false);
    }

    if (warnings.length > 0) {
      setWarningHtml(warnings.join("<br>"));
    } else {
      setWarningHtml(null);
    }
  };

  // Auto promotion on deposit input change
  const handleDepositChange = (val: string) => {
    setDepositAmt(val);
    const num = parseFloat(val) || 0;
    if (num > 0 && (status === "1. إدخال البيانات" || status === "2. محجوزة")) {
      setStatus("3. مودعة");
      setStatusMsg("⚡ تمت الترقية التلقائية إلى (3. مودعة) لوجود قيمة إيداع");
      setTimeout(() => setStatusMsg(""), 3500);
    }
  };

  // Auto promotion on booking date change
  const handleBookingDateChange = (val: string) => {
    setBookingDate(val);
    if (val && status === "1. إدخال البيانات") {
      setStatus("2. محجوزة");
      setStatusMsg("⚡ تمت الترقية التلقائية إلى (2. محجوزة) لتسجيل تاريخ الحجز");
      setTimeout(() => setStatusMsg(""), 3500);
    }
  };

  // Clear Form
  const handleClearForm = () => {
    setCardCode("");
    setCustomerName("");
    setNationalId("");
    setCblPhone("");
    setBank("مصرف التجارة والتنمية");
    setAccountNumber("");
    setIban("");
    setDepositAmt("0");
    setCardPrice("0");
    setDepositDate("");
    setBookingDate("");
    setCardNumber("");
    setPinLocal("");
    setPinDollar("");
    setExpiry("09/29");
    setStatus(currentEmployee.allowedStages[0] || "1. إدخال البيانات");
    setNotes("");
    setIsDepositLocked(false);
    setIsBookingLocked(false);
    setWarningHtml(null);
    setStatusMsg("");
  };

  // Instant Search
  const handleSearch = async () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      triggerAlert("البحث في المنظومة", "الرجاء كتابة اسم الزبون أو رقمه الوطني أو كود البطاقة للبحث.", "search");
      return;
    }

    // Try finding in current local cards first
    let found = cards.find(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nationalId.includes(q) ||
        c.cblPhone.includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.cardNum && c.cardNum.includes(q))
    );

    // If not found in local memory, query the central MySQL database
    if (!found) {
      try {
        const res = await fetch(`/api/cards?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.cards) && data.cards.length > 0) {
            found = data.cards[0];
            // Merge into local cards
            setCards((prev) => {
              const exists = prev.some((x) => x.id === found!.id || x.code === found!.code);
              return exists ? prev : [found!, ...prev];
            });
          }
        }
      } catch {
        // Network or DB error
      }
    }

    if (!found) {
      triggerAlert(
        "لم يتم العثور على أي زبون",
        `لم يتم العثور على أي نتائج مطابقة لكلمة: <strong>${q}</strong><br><br><span style="font-size:12px; color:#64748b;">يرجى التأكد من كتابة الاسم أو الرقم الوطني بشكل صحيح أو البدء بإضافة بطاقة جديدة.</span>`,
        "search"
      );
      return;
    }

    // Populate Form with found card
    setCardCode(found.code);
    setCustomerName(found.name);
    setNationalId(found.nationalId);
    setCblPhone(found.cblPhone);
    setBank(found.bank);
    setAccountNumber(found.accountNumber);
    setIban(found.iban);
    setDepositAmt(found.depositAmt.toString());
    setCardPrice(found.cardPrice.toString());
    setDepositDate(found.depositDate);
    setBookingDate(found.bookingDate);
    setCardNumber(found.cardNum);
    setPinLocal(found.pinLocal);
    setPinDollar(found.pinDollar);
    setExpiry(found.expiry || "09/29");
    setStatus(found.status);
    setNotes(found.notes);

    evaluateProtection(found);
    setStatusMsg(`✓ تم استرجاع بيانات: ${found.name}`);
  };

  // Save Card Handler
  const handleSaveCard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!customerName.trim()) {
      triggerAlert("حقل مطلوب", "الرجاء كتابة اسم الزبون الرباعي أولاً قبل الحفظ.", "warning");
      return;
    }

    let finalStatus = status;
    const depVal = parseFloat(depositAmt) || 0;
    if (depVal > 0 && (finalStatus === "1. إدخال البيانات" || finalStatus === "2. محجوزة")) {
      const confirmUpgrade = window.confirm(
        `💡 تم رصد قيمة إيداع مسجلة بمبلغ (${depVal.toLocaleString("en-US")} د.ل) بينما المرحلة هي (${finalStatus}).\n\nهل تريد ترقية المرحلة تلقائياً إلى (3. مودعة) قبل الحفظ؟`
      );
      if (confirmUpgrade) {
        finalStatus = "3. مودعة";
        setStatus(finalStatus);
      }
    }

    const assignedCode = cardCode || `CRD-${cards.length + 101}`;
    const newCard: BankCard = {
      id: assignedCode,
      code: assignedCode,
      name: customerName.trim(),
      nationalId: nationalId.trim(),
      cblPhone: cblPhone.trim(),
      bank,
      accountNumber: accountNumber.trim(),
      iban: iban.trim(),
      depositAmt: depVal,
      cardPrice: parseFloat(cardPrice) || 0,
      totalCost,
      depositDate,
      bookingDate,
      cardNum: cardNumber.trim(),
      pinLocal: pinLocal.trim(),
      pinDollar: pinDollar.trim(),
      expiry: expiry.trim(),
      status: finalStatus,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const existingIndex = cards.findIndex((c) => c.code === assignedCode);
    if (existingIndex >= 0) {
      const updated = [...cards];
      updated[existingIndex] = { ...updated[existingIndex], ...newCard };
      setCards(updated);
    } else {
      setCards([newCard, ...cards]);
    }

    // Persist to central MySQL database asynchronously
    fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCard),
    }).catch((err) => console.error("Error saving card to MySQL:", err));

    // Live Sync to Google Sheets in background if configured
    if (googleScriptUrl.trim()) {
      fetch("/api/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_card",
          scriptUrl: googleScriptUrl.trim(),
          card: newCard,
          employeeName: `${currentEmployee.name} (${currentEmployee.role})`,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d && d.success) {
            setGoogleConnected(true);
          }
        })
        .catch((err) => console.log("Google Sheets background sync error:", err));
    }

    setCardCode(assignedCode);
    evaluateProtection(newCard);

    setSuccessInfo({
      title: "تم حفظ بيانات الزبون بنجاح",
      details: `${bank} | ${finalStatus} | إجمالي التكلفة: ${totalCost.toLocaleString("en-US")} د.ل`,
      code: assignedCode,
    });
    setShowSuccessModal(true);
  };

  // Open Settle Modal
  const handleOpenSettle = () => {
    if (!customerName.trim()) {
      triggerAlert("بيانات التصفية", "الرجاء اختيار أو إدخال بيانات الزبون أولاً قبل فتح نافذة التصفية.", "warning");
      return;
    }
    setSettleError("");
    setSettleWorkflowMode("step1_receive_usd");
    setSettleRefSlipNo(`REF-${Math.floor(1000 + Math.random() * 9000)}`);
    setShowSettleModal(true);
  };

  // Step 1: Confirm USD Receipt into "خزينة الدولار النقدي (الخارج)"
  const handleConfirmReceiveUsd = () => {
    if (!isReceiveUsdValid) return;

    const usd = parseFloat(settleUsdAmount) || 0;
    const targetCode = cardCode || `CRD-${cards.length + 101}`;
    const updatedCard: BankCard = {
      id: targetCode,
      code: targetCode,
      name: customerName.trim(),
      nationalId: nationalId.trim(),
      cblPhone: cblPhone.trim(),
      bank,
      accountNumber: accountNumber.trim(),
      iban: iban.trim(),
      depositAmt: parseFloat(depositAmt) || 0,
      cardPrice: parseFloat(cardPrice) || 0,
      totalCost,
      depositDate,
      bookingDate,
      cardNum: cardNumber.trim(),
      pinLocal: pinLocal.trim(),
      pinDollar: pinDollar.trim(),
      expiry: expiry.trim(),
      status: "7. تم السحب والتصفية",
      notes: `${notes ? notes + " | " : ""}استلام دولار كاش: تم سحب $${usd.toLocaleString("en-US")} وتوريدها إلى (خزينة الدولار النقدي - الخارج) | إشاري: ${settleRefSlipNo} | مكان: ${settleWithdrawLocation}`,
      refSlipNo: settleRefSlipNo,
      withdrawLocation: settleWithdrawLocation,
      usdAmount: usd,
      rate: 0,
      netProfitLYD: 0,
      destinationVault: "خزينة الدولار النقدي (الخارج)",
      createdAt: new Date().toISOString(),
    };

    const exIndex = cards.findIndex((c) => c.code === targetCode);
    let updatedCardsList: BankCard[];
    if (exIndex >= 0) {
      const list = [...cards];
      list[exIndex] = updatedCard;
      updatedCardsList = list;
      setCards(list);
    } else {
      updatedCardsList = [updatedCard, ...cards];
      setCards(updatedCardsList);
    }

    // Persist settled card to MySQL
    fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCard),
    }).catch((err) => console.error("Error saving settled card to MySQL:", err));

    // Live Sync to Google Sheets
    if (googleScriptUrl.trim()) {
      fetch("/api/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_card",
          scriptUrl: googleScriptUrl.trim(),
          card: updatedCard,
          employeeName: `${currentEmployee.name} (${currentEmployee.role})`,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d && d.success) {
            setGoogleConnected(true);
          }
        })
        .catch((err) => console.log("Google sync error:", err));
    }

    // Update Treasury Vaults: add USD to "خزينة الدولار النقدي (الخارج)"
    const updatedVaultsList = vaults.map((v) => {
      if (v.id === "cash_usd" || v.name === "خزينة الدولار النقدي (الخارج)" || v.currency === "$") {
        return {
          ...v,
          id: "cash_usd",
          name: "خزينة الدولار النقدي (الخارج)",
          currency: "$",
          balance: v.balance + usd,
          totalIncome: v.totalIncome + usd,
        };
      }
      return v;
    });

    setVaults(updatedVaultsList);
    localStorage.setItem("amir_vaults_v2", JSON.stringify(updatedVaultsList));

    fetch("/api/vaults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_all", vaults: updatedVaultsList }),
    }).catch((err) => console.error("Error syncing vaults to MySQL:", err));

    // Automatically sync updated treasury balances to Google Sheets
    syncTreasuryToGoogleSheets(updatedVaultsList, true);

    setStatus("7. تم السحب والتصفية");
    setShowSettleModal(false);

    const newUsdTotal = availableUsd + usd;
    setSuccessInfo({
      title: "تم استلام الدولار وتوريده للخزينة بنجاح",
      details: `تم توريد $${usd.toLocaleString("en-US")} إلى (خزينة الدولار النقدي - الخارج) | إشاري: ${settleRefSlipNo} | مكان: ${settleWithdrawLocation}. الرصيد التراكمي في خزينة الدولار أصبح الآن: $${newUsdTotal.toLocaleString("en-US")}. يمكنك بيع الدولارات المجمعة لاحقاً من قسم الخزائن.`,
      code: targetCode,
    });
    setShowSuccessModal(true);
  };

  // Direct Settle & Sell to LYD
  const handleConfirmSettle = () => {
    if (!isDirectSaleValid) return;

    const usd = parseFloat(settleUsdAmount) || 0;
    const rate = parseFloat(settleRate) || 0;
    const totalSaleLYD = usd * rate;
    const profitLYD = totalSaleLYD - totalCost;

    // Update Card
    const targetCode = cardCode || `CRD-${cards.length + 101}`;
    const updatedCard: BankCard = {
      id: targetCode,
      code: targetCode,
      name: customerName.trim(),
      nationalId: nationalId.trim(),
      cblPhone: cblPhone.trim(),
      bank,
      accountNumber: accountNumber.trim(),
      iban: iban.trim(),
      depositAmt: parseFloat(depositAmt) || 0,
      cardPrice: parseFloat(cardPrice) || 0,
      totalCost,
      depositDate,
      bookingDate,
      cardNum: cardNumber.trim(),
      pinLocal: pinLocal.trim(),
      pinDollar: pinDollar.trim(),
      expiry: expiry.trim(),
      status: "7. تم السحب والتصفية",
      notes: `${notes ? notes + " | " : ""}تصفية وبيع: سحب $${usd.toLocaleString("en-US")} بسعر ${rate} د.ل وتوريد لـ (${settleVault}) | إشاري: ${settleRefSlipNo} | مكان: ${settleWithdrawLocation} | صافي ربح: ${profitLYD.toLocaleString("en-US")} د.ل`,
      refSlipNo: settleRefSlipNo,
      withdrawLocation: settleWithdrawLocation,
      usdAmount: usd,
      rate,
      netProfitLYD: profitLYD,
      destinationVault: settleVault,
      createdAt: new Date().toISOString(),
    };

    const exIndex = cards.findIndex((c) => c.code === targetCode);
    let updatedCardsList: BankCard[];
    if (exIndex >= 0) {
      const list = [...cards];
      list[exIndex] = updatedCard;
      updatedCardsList = list;
      setCards(list);
    } else {
      updatedCardsList = [updatedCard, ...cards];
      setCards(updatedCardsList);
    }

    // Persist settled card to MySQL
    fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCard),
    }).catch((err) => console.error("Error saving settled card to MySQL:", err));

    // Live Sync to Google Sheets
    if (googleScriptUrl.trim()) {
      fetch("/api/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_card",
          scriptUrl: googleScriptUrl.trim(),
          card: updatedCard,
          employeeName: `${currentEmployee.name} (${currentEmployee.role})`,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d && d.success) {
            setGoogleConnected(true);
          }
        })
        .catch((err) => console.log("Google sync error:", err));
    }

    // Update Treasury Vaults locally and in MySQL
    const updatedVaultsList = vaults.map((v) => {
      if (v.name === settleVault || (settleVault.includes("الكاش") && v.id === "cash_lyd")) {
        return {
          ...v,
          balance: v.balance + totalSaleLYD,
          totalIncome: v.totalIncome + totalSaleLYD,
        };
      }
      return v;
    });

    setVaults(updatedVaultsList);
    localStorage.setItem("amir_vaults_v2", JSON.stringify(updatedVaultsList));

    fetch("/api/vaults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_all", vaults: updatedVaultsList }),
    }).catch((err) => console.error("Error syncing vaults to MySQL:", err));

    // Automatically sync updated treasury balances to Google Sheets
    syncTreasuryToGoogleSheets(updatedVaultsList, true);

    setStatus("7. تم السحب والتصفية");
    setShowSettleModal(false);

    setSuccessInfo({
      title: "تمت التصفية والتوريد للخزينة بنجاح",
      details: `تم بيع $${usd.toLocaleString("en-US")} بسعر ${rate} د.ل بإجمالي ${totalSaleLYD.toLocaleString("en-US")} د.ل إلى (${settleVault}) | صافي الربح: ${profitLYD.toLocaleString("en-US")} د.ل`,
      code: targetCode,
    });
    setShowSuccessModal(true);
  };

  // Step 2: Confirm Selling Accumulated USD from "خزينة الدولار النقدي (الخارج)"
  const handleConfirmSellUsd = () => {
    if (!isSellUsdValid) {
      if (sellUsdNum > availableUsd) {
        setSellUsdError(`المبلغ المطلوب بيعه ($${sellUsdNum.toLocaleString()}) أكبر من الرصيد المتوفر في خزينة الدولار ($${availableUsd.toLocaleString()})`);
      } else {
        setSellUsdError("الرجاء إدخال كمية دولار وسعر بيع صحيحين وتحديد الخزينة المستلمة.");
      }
      return;
    }

    const refCode = sellUsdRefNo.trim() || `SALE-USD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update Vaults: deduct USD from cash_usd, add LYD to destVault
    const updatedVaultsList = vaults.map((v) => {
      if (v.id === "cash_usd" || v.name === "خزينة الدولار النقدي (الخارج)" || v.currency === "$") {
        return {
          ...v,
          id: "cash_usd",
          name: "خزينة الدولار النقدي (الخارج)",
          currency: "$",
          balance: Math.max(0, v.balance - sellUsdNum),
        };
      }
      if (v.name === sellUsdDestVault || (sellUsdDestVault.includes("الكاش") && v.id === "cash_lyd")) {
        return {
          ...v,
          balance: v.balance + sellTotalSaleLYD,
          totalIncome: v.totalIncome + sellTotalSaleLYD,
        };
      }
      return v;
    });

    setVaults(updatedVaultsList);
    localStorage.setItem("amir_vaults_v2", JSON.stringify(updatedVaultsList));

    // Persist to MySQL
    fetch("/api/vaults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sell_usd",
        usdAmount: sellUsdNum,
        rate: sellRateNum,
        totalSaleLYD: sellTotalSaleLYD,
        destinationVault: sellUsdDestVault,
        refNo: refCode,
        performedBy: `${currentEmployee.name} (${currentEmployee.role})`,
        vaults: updatedVaultsList,
      }),
    }).catch((err) => console.error("Error selling USD in MySQL:", err));

    // Automatically sync updated treasury balances to Google Sheets
    syncTreasuryToGoogleSheets(updatedVaultsList, true);

    // Sync to Google Sheets movement log
    if (googleScriptUrl.trim()) {
      fetch("/api/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sell_usd",
          scriptUrl: googleScriptUrl.trim(),
          sellData: {
            usdAmount: sellUsdNum,
            rate: sellRateNum,
            totalSaleLYD: sellTotalSaleLYD,
            destinationVault: sellUsdDestVault,
            refNo: refCode,
            notes: sellUsdNotes.trim(),
          },
          employeeName: `${currentEmployee.name} (${currentEmployee.role})`,
        }),
      }).catch((err) => console.log("Google sync sell_usd error:", err));
    }

    setShowSellUsdModal(false);

    setSuccessInfo({
      title: "تم بيع دولارات كاش وتوريد الدينار بنجاح",
      details: `تم خصم $${sellUsdNum.toLocaleString("en-US")} من (خزينة الدولار النقدي - الخارج) وبيعها بسعر ${sellRateNum} د.ل بإجمالي ${sellTotalSaleLYD.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل وتوريدها إلى (${sellUsdDestVault}) | إشاري: ${refCode}. الرصيد المتبقي في خزينة الدولار: $${remainingUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      code: refCode,
    });
    setShowSuccessModal(true);
  };

  // Treasury Fund / Adjust
  const handleFundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt < 0) return;

    const updatedVaultsList = vaults.map((v) => {
      if (v.id === fundVaultId) {
        const newBal = fundMode === "set" ? amt : v.balance + amt;
        const newInc = fundMode === "set" ? Math.max(v.totalIncome, amt) : v.totalIncome + amt;
        return { ...v, balance: newBal, totalIncome: newInc };
      }
      return v;
    });

    setVaults(updatedVaultsList);
    localStorage.setItem("amir_vaults_v2", JSON.stringify(updatedVaultsList));

    // Persist fund change to MySQL
    fetch("/api/vaults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "fund",
        vaultId: fundVaultId,
        amount: amt,
        mode: fundMode,
        performedBy: `${currentEmployee.name} (${currentEmployee.role})`,
      }),
    }).catch((err) => console.error("Error funding vault in MySQL:", err));

    // Automatically sync updated treasury balances to Google Sheets
    syncTreasuryToGoogleSheets(updatedVaultsList, true);

    setFundAmount("");
    setShowFundModal(false);
  };

  // System Reset (Zeroing Out)
  const handleSystemResetConfirm = () => {
    if (resetPin !== "9999" && resetPin.trim().toLowerCase() !== "تصفير") {
      alert("رمز PIN غير صحيح. عملية التصفير مقفلة للمدير فقط (9999)");
      return;
    }

    const cashLYD = parseFloat(resetCashLYD) || 0;
    const dollarUSD = parseFloat(resetDollarUSD) || 0;

    const zeroedVaults: VaultAccount[] = DEFAULT_VAULTS.map((v) => {
      if (v.id === "cash_lyd") return { ...v, balance: cashLYD, totalIncome: cashLYD };
      if (v.id === "cash_usd") return { ...v, balance: dollarUSD, totalIncome: dollarUSD };
      return { ...v, balance: 0, totalIncome: 0 };
    });

    setCards([]);
    setVaults(zeroedVaults);
    handleClearForm();

    localStorage.removeItem("amir_cards_v2");
    localStorage.setItem("amir_vaults_v2", JSON.stringify(zeroedVaults));

    // Persist system reset to MySQL database
    fetch("/api/system-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin: resetPin,
        initialCashLYD: cashLYD,
        initialDollarUSD: dollarUSD,
      }),
    }).catch((err) => console.error("Error executing system reset in MySQL:", err));

    // Automatically sync reset treasury balances to Google Sheets
    syncTreasuryToGoogleSheets(zeroedVaults, true);

    setShowResetSystemModal(false);
    setShowTreasuryModal(false);
    setResetPin("");

    triggerAlert("تم تصفير المنظومة", "تمت تهيئة وتصفير كافة بيانات المنظومة والبطاقات بنجاح للبدء الفعلي النظيف.", "info");
  };

  // Filter cards for report modal
  const reportCards = useMemo(() => {
    if (reportStage === "الكل") return cards;
    return cards.filter((c) => c.status === reportStage);
  }, [cards, reportStage]);

  const reportTotalDep = reportCards.reduce((acc, c) => acc + (c.depositAmt || 0), 0);
  const reportTotalCardPrice = reportCards.reduce((acc, c) => acc + (c.cardPrice || 0), 0);
  const reportTotalCost = reportCards.reduce((acc, c) => acc + (c.totalCost || 0), 0);

  const isReceptionist = currentEmployee.role === "موظف استقبال";
  const isTreasuryOfficer = currentEmployee.role === "مسؤول إيداع وخزينة";
  const canSettle = currentEmployee.role === "مسؤول مالي ومكتب الخارج" || currentEmployee.role === "مدير عام";

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "10px" }}>
      {/* 1. Top Bar */}
      <div className="top-bar">
        <div className="top-bar-title">
          <h2>💎 منظومة بطاقات مصرفية (AMIR)</h2>
          <span style={{ fontSize: "11px", opacity: 0.85 }}>مخصصات النقد الأجنبي للأفراد ($4,000)</span>
        </div>

        <div className="top-bar-actions">
          {/* Treasury Balances Button */}
          <button type="button" className="btn-view-treasury" onClick={() => setShowTreasuryModal(true)}>
            🏦 أرصدة الخزائن والمصارف
          </button>

          {/* USD Cash Vault Quick Badge & Sell Action */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#fef3c7",
              border: "1px solid #fde68a",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#92400e",
            }}
          >
            <span>💵 خزينة الدولار النقدي:</span>
            <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#b45309", fontWeight: 800 }}>
              ${availableUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            {canSettle && availableUsd > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSellUsdAmount(availableUsd >= 4000 ? "4000" : availableUsd.toString());
                  setSellUsdRefNo(`SALE-USD-${Math.floor(1000 + Math.random() * 9000)}`);
                  setSellUsdError("");
                  setShowSellUsdModal(true);
                }}
                style={{
                  background: "#b45309",
                  color: "#fff",
                  border: "none",
                  padding: "3px 8px",
                  borderRadius: "5px",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  marginRight: "4px",
                }}
                title="الخطوة 2: بيع دولارات كاش مجمعة من الخزينة وتوريد الدينار"
              >
                💱 بيع
              </button>
            )}
          </div>

          {/* Google Sheets Live Sync Button */}
          <button
            type="button"
            className="btn-google-sync"
            onClick={() => {
              setGoogleSyncStatus(null);
              setShowGoogleSyncModal(true);
            }}
            title="تصدير وتحديث شيت جوجل مباشرة (Google Sheets Sync)"
          >
            📊 ربط وتصدير شيت جوجل
          </button>

          {/* Active User Role Badge */}
          <div className="user-profile-badge">
            <span className="user-role-tag">{currentEmployee.role}</span>
            <span>👤 {currentEmployee.name}</span>
            <button type="button" className="btn-switch-user" onClick={() => setShowLoginModal(true)}>
              🔑 تبديل (PIN)
            </button>
          </div>

          <span
            className="badge-mode"
            style={{
              background:
                googleConnected === true
                  ? "#059669"
                  : dbConnected === true
                  ? "#065f46"
                  : dbConnected === false
                  ? "#991b1b"
                  : "#2563eb",
              color: "#fff",
            }}
            title={
              googleConnected === true
                ? "متصل مباشرة بشيت جوجل السحابي المركزي (المزامنة اللحظية الشاملة)"
                : dbConnected === true
                ? "متصل بقاعدة بيانات MySQL المركزية"
                : "جاري المزامنة مع الشيت السحابي..."
            }
          >
            {googleConnected === true
              ? "🟢 شيت جوجل متصل (حي)"
              : dbConnected === true
              ? "🟢 قاعدة MySQL متصلة"
              : cardCode
              ? `تعديل المعاملة: ${cardCode}`
              : "تسجيل بطاقة جديدة"}
          </span>
        </div>
      </div>

      {/* 2. Role Instruction Banner */}
      <div
        className="role-banner"
        style={{
          background:
            currentEmployee.role === "مدير عام"
              ? "#f3e8ff"
              : currentEmployee.role === "مسؤول مالي ومكتب الخارج"
              ? "#fef3c7"
              : currentEmployee.role === "مسؤول إيداع وخزينة"
              ? "#dcfce7"
              : "#e0f2fe",
          borderColor:
            currentEmployee.role === "مدير عام"
              ? "#e9d5ff"
              : currentEmployee.role === "مسؤول مالي ومكتب الخارج"
              ? "#fde68a"
              : currentEmployee.role === "مسؤول إيداع وخزينة"
              ? "#bbf7d0"
              : "#bae6fd",
          color:
            currentEmployee.role === "مدير عام"
              ? "#6b21a8"
              : currentEmployee.role === "مسؤول مالي ومكتب الخارج"
              ? "#92400e"
              : currentEmployee.role === "مسؤول إيداع وخزينة"
              ? "#166534"
              : "#0369a1",
        }}
      >
        <span>
          {currentEmployee.role === "موظف استقبال" &&
            "📌 صلاحيتك (موظف استقبال): تسجيل الزبائن الجدد وحجز المخصصات (المراحل 1 و 2 فقط)."}
          {currentEmployee.role === "مسؤول إيداع وخزينة" &&
            "📌 صلاحيتك (مسؤول إيداع وخزينة): تأكيد التوريد بالمصرف (المرحلة 3) وإدخال رقم البطاقة."}
          {currentEmployee.role === "مسؤول مالي ومكتب الخارج" &&
            "📌 صلاحيتك (مكتب الخارج والمالي): شحن البطاقات، كشف السري دولار، وإتمام السحب والتصفية وبيع الدولار."}
          {currentEmployee.role === "مدير عام" &&
            "👑 صلاحيتك (المدير العام): إشراف كامل على كافة المراحل 1-7، الخزائن، والأرباح والتصفية وتصفير النظام."}
        </span>

        <span
          style={{
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "4px",
            background: isReceptionist ? "#dbeafe" : canSettle ? "#fee2e2" : "#dcfce7",
            color: isReceptionist ? "#1e40af" : canSettle ? "#991b1b" : "#166534",
            fontWeight: "bold",
          }}
        >
          {isReceptionist
            ? "🔒 الأرقام السرية محمية ومحجوبة"
            : isTreasuryOfficer
            ? "🔒 السري دولار مقيد للفرع الخارجي"
            : "🔓 السري دولار مفتوح للسحب وتوريد الخزينة"}
        </span>
      </div>

      {/* 3. Search & Reports Tool Bar */}
      <div className="controls-bar">
        <div className="search-box">
          <div className="search-input-wrap">
            <input
              type="text"
              placeholder="🔍 ابحث بالاسم، الرقم الوطني، رقم الهاتف، أو كود البطاقة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                className="btn-search-clear"
                style={{ display: "inline-flex" }}
                onClick={() => setSearchQuery("")}
                title="مسح خانة البحث"
              >
                ✕
              </button>
            )}
          </div>
          <button type="button" className="btn-search" onClick={handleSearch}>
            بحث فوري
          </button>
          <button
            type="button"
            className="btn-search"
            style={{ background: "#059669", marginRight: "6px" }}
            onClick={async () => {
              setStatusMsg("🔄 جاري مزامنة البطاقات وتصدير أرصدة الخزائن للشيت...");
              await syncCardsFromGoogleSheets(googleScriptUrl, false);
              await syncTreasuryToGoogleSheets(vaults, false);
            }}
            title="تحديث ومزامنة البطاقات وتصدير وتطابق أرصدة الخزائن فورياً مع شيت جوجل"
          >
            🔄 مزامنة الشيت
          </button>
        </div>

        <div className="report-box">
          <span style={{ fontSize: "12px", fontWeight: "bold", color: "#065f46" }}>طباعة كشف:</span>
          <select value={reportStage} onChange={(e) => setReportStage(e.target.value)}>
            {ALL_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="الكل">جميع البطاقات (سجل عام)</option>
          </select>
          <button type="button" className="btn-print" onClick={() => setShowReportModal(true)}>
            🖨️ فتح الكشف للطباعة
          </button>
        </div>
      </div>

      {/* 4. Smart Protection Warning Banner */}
      {warningHtml && (
        <div
          className="warning-banner-bar warning-banner-danger"
          style={{ display: "block" }}
          dangerouslySetInnerHTML={{ __html: warningHtml }}
        />
      )}

      {/* 5. Main Card Form (2 Columns Exact Replication of Image 1) */}
      <form onSubmit={handleSaveCard}>
        <div className="grid-container">
          {/* Section 1: Customer & Account Info */}
          <div className="card">
            <div className="card-title">
              <span>1. بيانات العميل والحساب المصرفي والتكلفة</span>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>المصارف الـ 9 المعتمدة</span>
            </div>

            <div className="form-group">
              <label>اسم الزبون الرباعي *</label>
              <input
                type="text"
                required
                placeholder="محمد عبد السلام السنوسي..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="row-2">
              <div className="form-group">
                <label>الرقم الوطني (12 خانة) *</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="119xxxxxxxx"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>هاتف المركزي (المربوط) *</label>
                <input
                  type="text"
                  placeholder="091xxxxxxx"
                  value={cblPhone}
                  onChange={(e) => setCblPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>المصرف *</label>
              <select value={bank} onChange={(e) => setBank(e.target.value)}>
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

            <div className="row-2">
              <div className="form-group">
                <label>رقم حساب الزبون</label>
                <input
                  type="text"
                  placeholder="01533010488074"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>رقم الآيبان للزبون (IBAN)</label>
                <input
                  type="text"
                  className="iban-input"
                  placeholder="LY00 0000 ..."
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                />
              </div>
            </div>

            {/* Cost fields */}
            <div className="row-2">
              <div className="form-group">
                <label>
                  قيمة الإيداع بالمصرف (د.ل) *
                  {isDepositLocked && (
                    <span className="lock-label-tag">🔒 مودعة سابقاً (للقراءة فقط)</span>
                  )}
                  {isDepositLocked && (
                    <button
                      type="button"
                      className="btn-admin-override"
                      onClick={() => {
                        const p = prompt("أدخل رمز PIN المصرح له (المدير 9999 أو الخزينة 2222) لفك القفل:");
                        if (p === "9999" || p === "2222") setIsDepositLocked(false);
                      }}
                    >
                      🔓 تعديل استثنائي
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  step="any"
                  value={depositAmt}
                  readOnly={isDepositLocked}
                  className={isDepositLocked ? "field-locked-danger" : ""}
                  onChange={(e) => handleDepositChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ color: "#0f766e" }}>سعر شراء البطاقة (د.ل) *</label>
                <input
                  type="number"
                  step="any"
                  value={cardPrice}
                  onChange={(e) => setCardPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="row-2">
              <div className="form-group">
                <label style={{ color: "#1e40af" }}>إجمالي التكلفة الكلية (د.ل)</label>
                <input
                  type="text"
                  readOnly
                  value={`${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل`}
                  style={{ background: "#eff6ff", fontWeight: "bold", color: "#1e40af" }}
                />
              </div>

              <div className="form-group">
                <label>
                  تاريخ الإيداع
                  {isDepositLocked && <span className="lock-label-tag">🔒 مسجل سابقاً</span>}
                </label>
                <input
                  type="date"
                  value={depositDate}
                  readOnly={isDepositLocked}
                  className={isDepositLocked ? "field-locked-danger" : ""}
                  onChange={(e) => setDepositDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Card & Stages Info */}
          <div className="card">
            <div className="card-title">
              <span>2. بيانات البطاقة ومرحلة المعاملة</span>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>المراحل والسرّيات</span>
            </div>

            <div className="row-2">
              <div className="form-group">
                <label>رقم البطاقة (16 رقم)</label>
                <input
                  type="text"
                  maxLength={19}
                  placeholder="8191 0021 9811 4263"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>
                  تاريخ الحجز بالمنظومة
                  {isBookingLocked && <span className="lock-label-tag">🔒 محجوزة مسبقاً</span>}
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  readOnly={isBookingLocked}
                  className={isBookingLocked ? "field-locked-danger" : ""}
                  onChange={(e) => handleBookingDateChange(e.target.value)}
                />
              </div>
            </div>

            <div className="row-2">
              <div className="form-group">
                <label>PIN المحلي (الدينار)</label>
                <input
                  type={isReceptionist ? "password" : "text"}
                  className={isReceptionist ? "pin-local pin-locked" : "pin-local"}
                  disabled={isReceptionist}
                  placeholder={isReceptionist ? "••••" : "الرقم السري المحلي"}
                  value={isReceptionist ? "••••" : pinLocal}
                  onChange={(e) => setPinLocal(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ color: "#1d4ed8" }}>الرقم السري الدولي (السري دولار) *</label>
                <input
                  type={isReceptionist || isTreasuryOfficer ? "password" : "text"}
                  className={isReceptionist || isTreasuryOfficer ? "pin-dollar pin-locked" : "pin-dollar"}
                  disabled={isReceptionist || isTreasuryOfficer}
                  placeholder={isReceptionist || isTreasuryOfficer ? "••••" : "السري دولار"}
                  value={isReceptionist || isTreasuryOfficer ? "••••" : pinDollar}
                  onChange={(e) => setPinDollar(e.target.value)}
                />
              </div>
            </div>

            <div className="row-2">
              <div className="form-group">
                <label>تاريخ الصلاحية (MM/YY)</label>
                <input
                  type="text"
                  maxLength={5}
                  value={expiry}
                  placeholder="09/29"
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>المرحلة الحالية للبطاقة *</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const nextStg = e.target.value;
                    setStatus(nextStg);
                    if (nextStg === "7. تم السحب والتصفية") handleOpenSettle();
                  }}
                >
                  {currentEmployee.allowedStages.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>ملاحظات وبيان المعاملة</label>
              <input
                type="text"
                placeholder="ملاحظات حول الفرع، رقم الصك، أو التوريد..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 6. Actions Bar */}
        <div className="actions">
          <button type="button" className="btn-clear" onClick={handleClearForm}>
            🔄 تفريغ الخانات (بطاقة جديدة)
          </button>

          {canSettle && (
            <button type="button" className="btn-settle-action" onClick={handleOpenSettle}>
              💰 تصفية وبيع الدولار وتوريد الخزينة
            </button>
          )}

          <span style={{ fontSize: "12px", fontWeight: "bold", color: "#15803d" }}>{statusMsg}</span>

          <button type="submit" className="btn-save">
            💾 ترحيل وحفظ البطاقة
          </button>
        </div>
      </form>

      {/* =========================================================================
          MODALS
      ========================================================================= */}

      {/* Settle & Sell Dollar Modal */}
      {showSettleModal && (
        <div id="settleModal" style={{ display: "flex" }}>
          <div className="modal-card modal-card-large">
            <div className="settle-icon-wrap">💵</div>
            <div className="modal-title" style={{ textAlign: "center" }}>
              {settleWorkflowMode === "step1_receive_usd"
                ? "الخطوة 1: استلام الدولار وتوريده لخزينة الدولار النقدي (الخارج)"
                : "تصفية البطاقة وبيع الدولار وتوريد الأرباح بالدينار"}
            </div>
            <div className="modal-subtitle" style={{ textAlign: "center" }}>
              {settleWorkflowMode === "step1_receive_usd"
                ? "تأكيد سحب رصيد البطاقة وتوريدها مباشرة كـ كاش إلى (خزينة الدولار النقدي - الخارج) لتتجمع الأرصدة معاً لحين بيعها لاحقاً."
                : "إدخال سعر بيع الدولار المسحوب في السوق الموازي وتوريد القيمة الناتجة مباشرة لخزينة الدينار واحتساب صافي الأرباح تلقائياً."}
            </div>

            {/* Workflow Mode Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "14px",
                background: "#f1f5f9",
                padding: "4px",
                borderRadius: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setSettleWorkflowMode("step1_receive_usd")}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  background: settleWorkflowMode === "step1_receive_usd" ? "#059669" : "transparent",
                  color: settleWorkflowMode === "step1_receive_usd" ? "#ffffff" : "#475569",
                  boxShadow: settleWorkflowMode === "step1_receive_usd" ? "0 2px 4px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                📥 الخطوة 1: استلام الدولار في الخزينة ($)
              </button>
              <button
                type="button"
                onClick={() => setSettleWorkflowMode("direct_sale_lyd")}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  background: settleWorkflowMode === "direct_sale_lyd" ? "#2563eb" : "transparent",
                  color: settleWorkflowMode === "direct_sale_lyd" ? "#ffffff" : "#475569",
                  boxShadow: settleWorkflowMode === "direct_sale_lyd" ? "0 2px 4px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                💱 بيع فوري ومباشر بالدينار (سوق موازي)
              </button>
            </div>

            {/* Card Summary Bar */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                marginBottom: "14px",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>الزبون: <strong style={{ color: "#0f172a" }}>{customerName}</strong></div>
              <div>كود البطاقة: <strong style={{ color: "#2563eb" }}>{cardCode || "معاملة جديدة"}</strong></div>
              <div>التكلفة المحسوبة: <strong style={{ color: "#b91c1c" }}>{totalCost.toLocaleString("en-US")} د.ل</strong></div>
            </div>

            {/* TAB 1: Step 1 Receive USD into "خزينة الدولار النقدي (الخارج)" */}
            {settleWorkflowMode === "step1_receive_usd" && (
              <>
                <div className="row-2">
                  <div className="form-group">
                    <label style={{ color: "#065f46", fontWeight: "bold" }}>المبلغ المستلم بالدولار ($) *</label>
                    <input
                      type="number"
                      step="any"
                      value={settleUsdAmount}
                      onChange={(e) => setSettleUsdAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "#0f172a", fontWeight: "bold" }}>الخزينة المستلمة (تلقائي) *</label>
                    <div
                      style={{
                        background: "#fefce8",
                        border: "1px solid #fef08a",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <strong style={{ color: "#854d0e", fontSize: "12px" }}>خزينة الدولار النقدي (الخارج)</strong>
                      <span style={{ fontSize: "11px", background: "#fef08a", color: "#713f12", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
                        عملة صعبة: $
                      </span>
                    </div>
                  </div>
                </div>

                <div className="row-2">
                  <div className="form-group">
                    <label style={{ color: "#0f172a", fontWeight: "bold" }}>الرقم الإشاري (Slip / Ref No) *</label>
                    <input
                      type="text"
                      placeholder="مثال: REF-9942 / إشعار رقم 204"
                      value={settleRefSlipNo}
                      onChange={(e) => setSettleRefSlipNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "#0f172a", fontWeight: "bold" }}>مكان ودولة السحب *</label>
                    <input
                      type="text"
                      placeholder="مثال: تركيا - إسطنبول، دبي..."
                      value={settleWithdrawLocation}
                      onChange={(e) => setSettleWithdrawLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Real-time USD Vault Calculation Boxes */}
                <div className="calc-card-grid">
                  <div className="calc-box" style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}>
                    <div className="calc-box-title" style={{ color: "#065f46" }}>المبلغ المستلم للبطاقة ($)</div>
                    <div className="calc-box-value" style={{ color: "#047857" }}>
                      +${(parseFloat(settleUsdAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="calc-box" style={{ background: "#fefce8", borderColor: "#fde047" }}>
                    <div className="calc-box-title" style={{ color: "#854d0e" }}>رصيد خزينة الدولار الحالي</div>
                    <div className="calc-box-value" style={{ color: "#a16207" }}>
                      ${availableUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="calc-box" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
                    <div className="calc-box-title" style={{ color: "#1d4ed8" }}>الرصيد التراكمي المتوقع بعد التوريد</div>
                    <div className="calc-box-value" style={{ color: "#1e40af" }}>
                      ${(availableUsd + (parseFloat(settleUsdAmount) || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "11px",
                    color: "#166534",
                    marginBottom: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  💡 <strong>ملاحظة هامة (الدورة المرحلية):</strong> عند التأكيد، سيتم توريد الـ ${(parseFloat(settleUsdAmount) || 0).toLocaleString()} مباشرة في خزينة الدولار النقدي (الخارج). يمكنك في أي وقت بيع دفعات مجمعة من الرصيد المتراكم بسعر السوق الموازي من قسم <strong>"🏦 أرصدة الخزائن"</strong>.
                </div>

                {!isReceiveUsdValid && (
                  <div
                    style={{
                      background: "#fef3c7",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      marginBottom: "10px",
                      textAlign: "center",
                    }}
                  >
                    🔒 زر التأكيد مقفل: يرجى كتابة الرقم الإشاري ومكان السحب وقيمة المبلغ بالدولار لتأكيد الاستلام
                  </div>
                )}

                <button
                  type="button"
                  className="btn-confirm-settle"
                  style={{ background: "#059669" }}
                  disabled={!isReceiveUsdValid}
                  onClick={handleConfirmReceiveUsd}
                >
                  📥 تأكيد استلام ${(parseFloat(settleUsdAmount) || 0).toLocaleString()} وتوريدها لخزينة الدولار النقدي (الخارج)
                </button>
              </>
            )}

            {/* TAB 2: Direct Sale to LYD */}
            {settleWorkflowMode === "direct_sale_lyd" && (
              <>
                <div className="row-2">
                  <div className="form-group">
                    <label>المبلغ المسحوب بالدولار ($) *</label>
                    <input
                      type="number"
                      step="any"
                      value={settleUsdAmount}
                      onChange={(e) => setSettleUsdAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "#b45309" }}>سعر بيع الدولار بالسوق الموازي (د.ل) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settleRate}
                      onChange={(e) => setSettleRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row-2">
                  <div className="form-group">
                    <label style={{ color: "#0f172a", fontWeight: "bold" }}>الرقم الإشاري (Slip / Ref No) *</label>
                    <input
                      type="text"
                      placeholder="مثال: REF-9942 / إشعار رقم 204"
                      value={settleRefSlipNo}
                      onChange={(e) => setSettleRefSlipNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ color: "#0f172a", fontWeight: "bold" }}>مكان ودولة السحب *</label>
                    <input
                      type="text"
                      placeholder="مثال: تركيا - إسطنبول، دبي..."
                      value={settleWithdrawLocation}
                      onChange={(e) => setSettleWithdrawLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Real-time Calculation Boxes */}
                <div className="calc-card-grid">
                  <div className="calc-box" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
                    <div className="calc-box-title" style={{ color: "#1d4ed8" }}>إجمالي البيع بالدينار (د.ل)</div>
                    <div className="calc-box-value" style={{ color: "#1d4ed8" }}>
                      {settleTotalSale.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
                    </div>
                  </div>
                  <div className="calc-box" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                    <div className="calc-box-title" style={{ color: "#15803d" }}>صافي الربح المحقق (د.ل)</div>
                    <div className="calc-box-value" style={{ color: "#15803d" }}>
                      {settleNetProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ color: "#065f46", fontWeight: "bold" }}>الخزينة المستلمة لتوريد المبلغ بالدينار *</label>
                  <select value={settleVault} onChange={(e) => setSettleVault(e.target.value)}>
                    {vaults
                      .filter((v) => v.currency === "د.ل")
                      .map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                  </select>
                </div>

                {!isDirectSaleValid && (
                  <div
                    style={{
                      background: "#fef3c7",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      marginBottom: "10px",
                      textAlign: "center",
                    }}
                  >
                    🔒 زر التأكيد مقفل: يرجى كتابة الرقم الإشاري ومكان السحب وقيمة وسعر البيع لتفعيل التصفية
                  </div>
                )}

                <button
                  type="button"
                  className="btn-confirm-settle"
                  disabled={!isDirectSaleValid}
                  onClick={handleConfirmSettle}
                >
                  🚀 تأكيد التصفية وتوريد المبلغ فوراً للخزينة بالدينار
                </button>
              </>
            )}

            {settleError && (
              <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" }}>
                {settleError}
              </div>
            )}

            <button type="button" className="btn-secondary-action" onClick={() => setShowSettleModal(false)}>
              إلغاء التصفية
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Modal for Selling Accumulated USD Cash */}
      {showSellUsdModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10002, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto" }}>
          <div className="modal-card modal-card-large" style={{ maxWidth: "600px", textAlign: "right" }}>
            <div className="settle-icon-wrap" style={{ background: "#fef3c7", color: "#b45309" }}>💱</div>
            <div className="modal-title" style={{ textAlign: "center" }}>
              الخطوة 2: بيع دولارات كاش من خزينة الدولار النقدي (الخارج)
            </div>
            <div className="modal-subtitle" style={{ textAlign: "center", marginBottom: "14px" }}>
              سحب مبالغ بالدولار من الرصيد التراكمي المجمع في الخزينة وبيعه بالسوق الموازي وتوريد القيمة الناتجة بالدينار الليبي
            </div>

            {/* Current USD Balance Card & Quick Pickers */}
            <div
              style={{
                background: "#fefce8",
                border: "1px solid #fde047",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#854d0e", fontWeight: "bold" }}>
                    🏦 رصيد خزينة الدولار النقدي (الخارج) المتاح للبيع:
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#a16207", fontFamily: "monospace", marginTop: "2px" }}>
                    ${availableUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSellUsdAmount(availableUsd.toString());
                      setSellUsdError("");
                    }}
                    style={{
                      background: "#eab308",
                      color: "#713f12",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    كامل الرصيد (${availableUsd.toLocaleString()})
                  </button>
                  {availableUsd >= 4000 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSellUsdAmount("4000");
                        setSellUsdError("");
                      }}
                      style={{
                        background: "#fff",
                        color: "#854d0e",
                        border: "1px solid #fde047",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      $4,000 (بطاقة)
                    </button>
                  )}
                  {availableUsd >= 8000 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSellUsdAmount("8000");
                        setSellUsdError("");
                      }}
                      style={{
                        background: "#fff",
                        color: "#854d0e",
                        border: "1px solid #fde047",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      $8,000
                    </button>
                  )}
                  {availableUsd >= 20000 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSellUsdAmount("20000");
                        setSellUsdError("");
                      }}
                      style={{
                        background: "#fff",
                        color: "#854d0e",
                        border: "1px solid #fde047",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      $20,000
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="row-2">
              <div className="form-group">
                <label style={{ color: "#b45309", fontWeight: "bold" }}>المبلغ المراد بيعه بالدولار ($) *</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={availableUsd}
                  value={sellUsdAmount}
                  onChange={(e) => {
                    setSellUsdAmount(e.target.value);
                    setSellUsdError("");
                  }}
                />
              </div>
              <div className="form-group">
                <label style={{ color: "#065f46", fontWeight: "bold" }}>سعر بيع الدولار بالسوق الموازي (د.ل) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={sellUsdRate}
                  onChange={(e) => {
                    setSellUsdRate(e.target.value);
                    setSellUsdError("");
                  }}
                />
              </div>
            </div>

            <div className="row-2">
              <div className="form-group">
                <label style={{ color: "#065f46", fontWeight: "bold" }}>الخزينة المستلمة لتوريد المبلغ بالدينار *</label>
                <select value={sellUsdDestVault} onChange={(e) => setSellUsdDestVault(e.target.value)}>
                  {vaults
                    .filter((v) => v.currency === "د.ل")
                    .map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ color: "#0f172a", fontWeight: "bold" }}>الرقم الإشاري / رقم العملية *</label>
                <input
                  type="text"
                  placeholder="مثال: SALE-USD-4921 / إشعار بيع"
                  value={sellUsdRefNo}
                  onChange={(e) => setSellUsdRefNo(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>ملاحظات وبيان المعاملة</label>
              <input
                type="text"
                placeholder="مثال: بيع دفعة دولارات كاش مجمعة بسعر السوق وتوريد لخزينة الكاش..."
                value={sellUsdNotes}
                onChange={(e) => setSellUsdNotes(e.target.value)}
              />
            </div>

            {/* Live Calculation Boxes */}
            <div className="calc-card-grid">
              <div className="calc-box" style={{ background: "#fefce8", borderColor: "#fde047" }}>
                <div className="calc-box-title" style={{ color: "#854d0e" }}>المبلغ المباع بالدولار</div>
                <div className="calc-box-value" style={{ color: "#a16207" }}>
                  ${sellUsdNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="calc-box" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
                <div className="calc-box-title" style={{ color: "#1d4ed8" }}>إجمالي التوريد بالدينار (د.ل)</div>
                <div className="calc-box-value" style={{ color: "#1d4ed8" }}>
                  {sellTotalSaleLYD.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل
                </div>
              </div>
              <div className="calc-box" style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}>
                <div className="calc-box-title" style={{ color: "#065f46" }}>المتبقي في خزينة الدولار</div>
                <div className="calc-box-value" style={{ color: "#047857" }}>
                  ${remainingUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {sellUsdNum > availableUsd && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                ⚠️ تنبيه: المبلغ المطلوب بيعه (${sellUsdNum.toLocaleString()}) أكبر من الرصيد المتوفر في خزينة الدولار (${availableUsd.toLocaleString()})
              </div>
            )}

            {sellUsdError && (
              <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" }}>
                {sellUsdError}
              </div>
            )}

            <button
              type="button"
              className="btn-confirm-settle"
              style={{ background: "#b45309" }}
              disabled={!isSellUsdValid}
              onClick={handleConfirmSellUsd}
            >
              🚀 تأكيد بيع الدولار وتوريد {sellTotalSaleLYD.toLocaleString("en-US", { minimumFractionDigits: 2 })} د.ل إلى ({sellUsdDestVault})
            </button>
            <button type="button" className="btn-secondary-action" onClick={() => setShowSellUsdModal(false)}>
              إلغاء العملية
            </button>
          </div>
        </div>
      )}

      {/* Treasury Modal */}
      {showTreasuryModal && (
        <div id="treasuryModal" style={{ display: "flex" }}>
          <div className="modal-card modal-card-large">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid #064e3b",
                paddingBottom: "8px",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <h3 style={{ color: "#064e3b", fontSize: "16px" }}>🏦 أرصدة الخزائن والمصارف اللحظية</h3>
                <span style={{ fontSize: "11px", color: "#64748b" }}>متابعة السيولة وحركات النقدية والأرباح المحققة</span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {canSettle && (
                  <button
                    type="button"
                    onClick={() => {
                      setSellUsdAmount(availableUsd > 0 ? (availableUsd >= 4000 ? "4000" : availableUsd.toString()) : "0");
                      setSellUsdRefNo(`SALE-USD-${Math.floor(1000 + Math.random() * 9000)}`);
                      setSellUsdError("");
                      setShowSellUsdModal(true);
                    }}
                    style={{
                      background: "#b45309",
                      color: "white",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="الخطوة 2: بيع دولارات كاش مجمعة وتوريد المقابل بالدينار"
                  >
                    💱 بيع دولارات كاش من الخزينة
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFundModal(true)}
                  style={{
                    background: "#059669",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ➕ تغذية / تعديل رصيد
                </button>
                <button
                  type="button"
                  disabled={isSyncingGoogle}
                  onClick={async () => {
                    const res = await syncTreasuryToGoogleSheets(vaults, false);
                    if (res && !res.success && (res as any).needsScriptUpdate) {
                      setShowGoogleSyncModal(true);
                      setShowScriptGuide(true);
                    }
                  }}
                  style={{
                    background: "#0284c7",
                    color: "white",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: isSyncingGoogle ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="تصدير وتحديث أرصدة الخزائن الحالية فوراً في ورقة أرصدة_الخزائن بشيت جوجل"
                >
                  {isSyncingGoogle ? "⏳ جاري التصدير..." : "📤 تصدير الأرصدة للشيت"}
                </button>
                <button
                  type="button"
                  disabled={isSyncingGoogle}
                  onClick={() => importTreasuryFromGoogleSheets(false)}
                  style={{
                    background: "#0d9488",
                    color: "white",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: isSyncingGoogle ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="سحب أرصدة الخزائن من ورقة أرصدة_الخزائن بشيت جوجل"
                >
                  📥 استيراد من الشيت
                </button>
                {currentEmployee.role === "مدير عام" && (
                  <button
                    type="button"
                    onClick={() => setShowResetSystemModal(true)}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ تصفير المنظومة
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#166534",
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <span>
                🟢 <strong>مزامنة شيت جوجل:</strong> أرصدة الخزائن مرتبطة بورقة <code>أرصدة_الخزائن</code> وتتطابق تلقائياً مع كل حركة أو عند الضغط على تصدير.
              </span>
              <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "bold" }}>
                ✓ تطابق تام 100% بين الموقع والشيت
              </span>
            </div>

            <table className="treasury-table">
              <thead>
                <tr>
                  <th>الحساب / الخزينة</th>
                  <th>النوع</th>
                  <th>العملة</th>
                  <th>الرصيد الفعلي المتوفر</th>
                </tr>
              </thead>
              <tbody>
                {vaults.map((v) => (
                  <tr key={v.id} style={{ background: v.id === "cash_usd" ? "#fefce8" : "inherit" }}>
                    <td>
                      <strong>{v.name}</strong>
                      {v.id === "cash_usd" && (
                        <span style={{ fontSize: "10px", background: "#fef08a", color: "#854d0e", padding: "1px 6px", borderRadius: "4px", marginRight: "6px", fontWeight: "bold" }}>
                          عملة صعبة ($)
                        </span>
                      )}
                    </td>
                    <td style={{ color: "#64748b", fontSize: "11px" }}>{v.type}</td>
                    <td><strong>{v.currency}</strong></td>
                    <td
                      style={{
                        fontWeight: "bold",
                        fontFamily: "monospace",
                        color: v.currency === "$" ? "#b45309" : v.balance > 0 ? "#15803d" : "#0f172a",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>
                          {v.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} {v.currency}
                        </span>
                        {v.id === "cash_usd" && canSettle && (
                          <button
                            type="button"
                            onClick={() => {
                              setSellUsdAmount(v.balance > 0 ? (v.balance >= 4000 ? "4000" : v.balance.toString()) : "0");
                              setSellUsdRefNo(`SALE-USD-${Math.floor(1000 + Math.random() * 9000)}`);
                              setSellUsdError("");
                              setShowSellUsdModal(true);
                            }}
                            style={{
                              background: "#d97706",
                              color: "#fff",
                              border: "none",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 800,
                              cursor: "pointer",
                              marginRight: "8px",
                            }}
                            title="بيع دولارات كاش مجمعة وتوريد الدينار"
                          >
                            💱 بيع دولار
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "14px", textAlign: "left" }}>
              <button
                type="button"
                className="btn-secondary-action"
                style={{ width: "auto", padding: "6px 18px" }}
                onClick={() => setShowTreasuryModal(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fund / Adjust Balance Modal */}
      {showFundModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card" style={{ maxWidth: "420px", textAlign: "right" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#0f172a", marginBottom: "8px" }}>تغذية أو ضبط رصيد الخزينة</h3>
            <form onSubmit={handleFundSubmit} className="space-y-3">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "10px" }}>
                <button
                  type="button"
                  onClick={() => setFundMode("add")}
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    background: fundMode === "add" ? "#059669" : "#f1f5f9",
                    color: fundMode === "add" ? "white" : "#475569",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ➕ إضافة رصيد (تغذية)
                </button>
                <button
                  type="button"
                  onClick={() => setFundMode("set")}
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    background: fundMode === "set" ? "#2563eb" : "#f1f5f9",
                    color: fundMode === "set" ? "white" : "#475569",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ✏️ ضبط الرصيد الفعلي
                </button>
              </div>

              <div className="form-group">
                <label>اختر الخزينة / الحساب</label>
                <select value={fundVaultId} onChange={(e) => setFundVaultId(e.target.value)}>
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{fundMode === "set" ? "الرصيد الفعلي الجديد" : "المبلغ المراد إضافته"}</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder={fundMode === "set" ? "مثال: 0 أو 50000" : "مثال: 50000"}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button type="submit" className="btn-primary-action" style={{ flex: 1, marginBottom: 0 }}>
                  {fundMode === "set" ? "تأكيد ضبط الرصيد" : "تأكيد الإضافة"}
                </button>
                <button type="button" className="btn-secondary-action" style={{ width: "auto" }} onClick={() => setShowFundModal(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login / Switch Role Modal */}
      {showLoginModal && (
        <div id="loginModal" style={{ display: "flex" }}>
          <div className="modal-card">
            <div className="login-icon-wrap">🔑</div>
            <div className="modal-title">تسجيل الدخول / تبديل الموظف</div>
            <div className="modal-subtitle">أدخل رمز الدخول (PIN) المكون من 4 أرقام لضبط الصلاحيات والشاشات المسموحة</div>

            <input
              type="password"
              className="pin-input"
              maxLength={4}
              placeholder="••••"
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handlePinLogin();
                }
              }}
            />

            {pinError && (
              <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "bold", marginBottom: "10px" }}>
                {pinError}
              </div>
            )}

            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold", marginBottom: "8px" }}>
              أو اختر الموظف بنقرة سريعة (تجربة فورية):
            </div>
            <div className="quick-roles">
              <button type="button" className="btn-quick-role" onClick={() => handlePinLogin("1111")}>
                👤 موظف استقبال<br /><span style={{ color: "#0284c7" }}>PIN: 1111</span>
              </button>
              <button type="button" className="btn-quick-role" onClick={() => handlePinLogin("2222")}>
                🏦 مسؤول إيداع وخزينة<br /><span style={{ color: "#059669" }}>PIN: 2222</span>
              </button>
              <button type="button" className="btn-quick-role" onClick={() => handlePinLogin("3333")}>
                ✈️ مالي ومكتب الخارج<br /><span style={{ color: "#d97706" }}>PIN: 3333</span>
              </button>
              <button type="button" className="btn-quick-role" onClick={() => handlePinLogin("9999")}>
                👑 المدير العام (أمير)<br /><span style={{ color: "#7c3aed" }}>PIN: 9999</span>
              </button>
            </div>

            <button type="button" className="btn-primary-action" onClick={() => handlePinLogin()}>
              تأكيد الدخول
            </button>
            <button type="button" className="btn-secondary-action" onClick={() => setShowLoginModal(false)}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Print Report Modal */}
      {showReportModal && (
        <div id="reportModal" style={{ display: "block" }}>
          <div className="report-content">
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #0f766e", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ color: "#0f172a", fontSize: "18px" }}>💎 منظومة بطاقات مصرفية (AMIR)</h2>
                <h4 style={{ color: "#0f766e", marginTop: "4px" }}>كشف معاملات المرحلة: {reportStage}</h4>
              </div>
              <div style={{ textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                <div>تاريخ التقرير: <strong style={{ color: "#0f172a" }}>{new Date().toLocaleDateString("ar-LY")}</strong></div>
                <div style={{ marginTop: "3px" }}>إجمالي البطاقات: <strong style={{ color: "#0f172a" }}>{reportCards.length}</strong> بطاقة</div>
                <div>إجمالي الإيداعات: <strong style={{ color: "#0f172a" }}>{reportTotalDep.toLocaleString("en-US")}</strong> د.ل</div>
                <div>إجمالي شراء البطاقات: <strong style={{ color: "#0f766e" }}>{reportTotalCardPrice.toLocaleString("en-US")}</strong> د.ل</div>
                <div>التكلفة الإجمالية: <strong style={{ color: "#1e40af" }}>{reportTotalCost.toLocaleString("en-US")}</strong> د.ل</div>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>كود</th>
                  <th>اسم الزبون</th>
                  <th>الرقم الوطني</th>
                  <th>المصرف</th>
                  <th>رقم الحساب</th>
                  <th>قيمة الإيداع</th>
                  <th>سعر البطاقة</th>
                  <th>إجمالي التكلفة</th>
                  <th>تاريخ الحجز</th>
                  <th>المرحلة</th>
                </tr>
              </thead>
              <tbody>
                {reportCards.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "15px", color: "#94a3b8" }}>
                      لا توجد معاملات مسجلة في هذه المرحلة حالياً
                    </td>
                  </tr>
                ) : (
                  reportCards.map((c) => (
                    <tr key={c.id}>
                      <td>{c.code}</td>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.nationalId}</td>
                      <td>{c.bank}</td>
                      <td>{c.accountNumber || "-"}</td>
                      <td>{c.depositAmt.toLocaleString("en-US")}</td>
                      <td>{c.cardPrice.toLocaleString("en-US")}</td>
                      <td><strong>{c.totalCost.toLocaleString("en-US")}</strong></td>
                      <td>{c.bookingDate || "-"}</td>
                      <td>{c.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="no-print" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                style={{ padding: "8px 16px", border: "1px solid #cbd5e1", background: "#f1f5f9", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: "8px 20px", background: "#059669", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
              >
                🖨️ طباعة الآن (Print / PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div id="successModal" style={{ display: "flex" }}>
          <div className="modal-card">
            <div className="success-icon-wrap">✓</div>
            <div className="modal-title">{successInfo.title}</div>
            <div
              className="modal-subtitle"
              dangerouslySetInnerHTML={{ __html: successInfo.details }}
            />
            {successInfo.code && (
              <div>
                <span className="success-badge">كود البطاقة: {successInfo.code}</span>
              </div>
            )}
            <div className="success-actions">
              <button
                type="button"
                className="btn-new-customer"
                onClick={() => {
                  setShowSuccessModal(false);
                  handleClearForm();
                }}
              >
                ➕ إضافة زبون جديد
              </button>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowSuccessModal(false)}
              >
                ✕ متابعة العمل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {showAlertModal && (
        <div id="customAlertModal" style={{ display: "flex" }}>
          <div className="modal-card">
            <div className={`alert-icon-wrap ${alertInfo.type === "danger" ? "alert-icon-danger" : alertInfo.type === "info" ? "alert-icon-info" : "alert-icon-warning"}`}>
              {alertInfo.type === "danger" ? "❌" : alertInfo.type === "info" ? "ℹ️" : alertInfo.type === "search" ? "🔍" : "⚠️"}
            </div>
            <div className="modal-title">{alertInfo.title}</div>
            <div
              className="modal-subtitle"
              style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6, marginBottom: "16px" }}
              dangerouslySetInnerHTML={{ __html: alertInfo.message }}
            />
            <button
              type="button"
              className="btn-primary-action"
              style={{ marginBottom: 0 }}
              onClick={() => setShowAlertModal(false)}
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}

      {/* System Reset Modal (Zeroing Out) */}
      {showResetSystemModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10002, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card" style={{ maxWidth: "460px", textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontWeight: "bold", fontSize: "16px", marginBottom: "10px" }}>
              <span>🗑️ تصفير المنظومة للبدء الفعلي النظيف</span>
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, marginBottom: "14px" }}>
              سيقوم هذا الإجراء بمسح كافة البطاقات السابقة من المنظومة (0 بطاقات)، وتصفير صافي الأرباح، وضبط الأرصدة الافتتاحية الفعلية.
            </p>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "8px", marginBottom: "12px" }}>
              <div className="row-2">
                <div className="form-group">
                  <label>رصيد كاش الدينار الافتتاحي (د.ل)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={resetCashLYD}
                    onChange={(e) => setResetCashLYD(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>رصيد كاش الدولار الافتتاحي ($ USD)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={resetDollarUSD}
                    onChange={(e) => setResetDollarUSD(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ color: "#dc2626", fontWeight: "bold" }}>رمز PIN للمدير العام (9999) أو كلمة (تصفير) للتأكيد *</label>
              <input
                type="text"
                placeholder="اكتب 9999 هنا"
                style={{ textAlign: "center", fontWeight: "bold" }}
                value={resetPin}
                onChange={(e) => setResetPin(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={handleSystemResetConfirm}
              >
                تأكيد تصفير المنظومة
              </button>
              <button
                type="button"
                className="btn-secondary-action"
                style={{ width: "auto" }}
                onClick={() => setShowResetSystemModal(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Live Sync Modal */}
      {showGoogleSyncModal && (
        <div id="googleSyncModal" style={{ display: "flex" }}>
          <div className="modal-card modal-card-large">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>📊</span>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>ربط وتصدير قاعدة البيانات إلى شيت جوجل (Google Sheets)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleSyncModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, marginBottom: "14px" }}>
              يتيح هذا القسم إرسال وتصدير كافة البطاقات المسجلة في قاعدة بيانات الموقع مباشرة إلى شيت جوجل الخاص بك في Google Drive ليتحدث حياً وبشكل تلقائي.
            </p>

            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
              <div className="form-group" style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b" }}>رابط Google Apps Script Web App (المربوط بالشيت):</label>
                  {googleScriptUrl.trim() && (
                    <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>
                      ✓ تم حفظ الرابط
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={googleScriptUrl}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setGoogleScriptUrl(val);
                      if (val) {
                        localStorage.setItem("amir_google_script_url", val);
                      } else {
                        localStorage.removeItem("amir_google_script_url");
                      }
                    }}
                    style={{ fontSize: "13px", padding: "8px 10px", flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clipText = await navigator.clipboard.readText();
                        if (clipText && clipText.includes("script.google.com")) {
                          const val = clipText.trim();
                          setGoogleScriptUrl(val);
                          localStorage.setItem("amir_google_script_url", val);
                          setGoogleSyncStatus("✓ تم لصق وحفظ الرابط بنجاح! اضغط الآن على (🔍 فحص الاتصال بالشيت).");
                        } else {
                          alert("الرجاء نسخ رابط Web App أولاً من شيت جوجل، أو استخدم اللصق المباشر (Ctrl+V) في الخانة.");
                        }
                      } catch {
                        alert("يرجى استخدام اختصار اللصق (Ctrl + V) داخل خانة الرابط.");
                      }
                    }}
                    style={{
                      background: "#0284c7",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    📋 لصق
                  </button>
                  {googleScriptUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setGoogleScriptUrl("");
                        localStorage.removeItem("amir_google_script_url");
                        setGoogleSyncStatus("تم مسح الرابط القديم. يمكنك الآن لصق الرابط النشط الجديد.");
                      }}
                      style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      title="مسح الرابط القديم"
                    >
                      ✕ مسح
                    </button>
                  )}
                </div>
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                💡 الصق هنا الرابط المنسوخ من نافذة &quot;إدارة عمليات النشر&quot; في شيت جوجل (الرابط الذي ينتهي بـ /exec).
              </span>
            </div>

            {/* Apps Script Code Copy & Guide Box */}
            <div
              style={{
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <strong style={{ fontSize: "13px", color: "#0369a1", display: "block" }}>
                    📜 كود Google Apps Script المحدث (Code.gs)
                  </strong>
                  <span style={{ fontSize: "11px", color: "#0284c7" }}>
                    يحتوي على دوال مزامنة وتصدير الخزائن، بيع الدولار، وسجل الحركات
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    style={{
                      background: "#0284c7",
                      color: "white",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    📋 نسخ الكود كاملاً (Code.gs)
                  </button>
                  <a
                    href="/api/google-script-code"
                    download="Code.gs"
                    style={{
                      background: "#e0f2fe",
                      color: "#0369a1",
                      border: "1px solid #7dd3fc",
                      padding: "7px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    📥 تحميل كملف
                  </a>
                </div>
              </div>

              {copyCodeStatus && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    background: copyCodeStatus.startsWith("✓") ? "#ecfdf5" : "#eff6ff",
                    color: copyCodeStatus.startsWith("✓") ? "#065f46" : "#1e40af",
                    border: copyCodeStatus.startsWith("✓") ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
                  }}
                >
                  {copyCodeStatus}
                </div>
              )}

              <div style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowScriptGuide(!showScriptGuide)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0369a1",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  {showScriptGuide ? "▲ إخفاء خطوات تحديث الشيت" : "▼ اضغط هنا لمشاهدة خطوات وضع الكود في شيت جوجل (4 خطوات بسيطة)"}
                </button>

                {showScriptGuide && (
                  <div
                    style={{
                      marginTop: "10px",
                      background: "#ffffff",
                      border: "1px dashed #0284c7",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "12px",
                      lineHeight: "1.8",
                      color: "#0f172a",
                    }}
                  >
                    <ol style={{ paddingRight: "20px", margin: 0 }}>
                      <li>
                        اضغط على زر <strong>(📋 نسخ الكود كاملاً)</strong> في الأعلى.
                      </li>
                      <li>
                        افتح شيت جوجل <strong>(بطاقات_مصرفية_ماستر)</strong>، ومن القائمة اضغط على <strong>ملحقات (Extensions)</strong> ⬅️ ثم <strong>Apps Script</strong>.
                      </li>
                      <li>
                        في ملف <strong>Code.gs</strong> (أو &quot;الرمز&quot;): حدد كل الكود القديم واحذفه (اضغط <code>Ctrl + A</code> ثم <code>Delete</code>)، ثم الصق الكود الجديد (<code>Ctrl + V</code>)، واضغط حفظ 💾 (<code>Ctrl + S</code>).
                      </li>
                      <li>
                        اضغط على زر <strong>نشر (Deploy)</strong> الأزرق في الأعلى ⬅️ <strong>إدارة عمليات النشر (Manage deployments)</strong> ⬅️ اضغط على أيقونة <strong>القلم ✏️</strong> ⬅️ في خانة الإصدار (Version) اختر <strong>إصدار جديد (New version)</strong> ⬅️ اضغط <strong>Deploy (نشر)</strong>.
                      </li>
                      <li>
                        <strong>الخطوة الحاسمة (نسخ الرابط ولصقه هنا):</strong> في نفس النافذة، انظر تحت <strong>تطبيق الويب (Web App)</strong> واضغط على زر <strong>نسخ</strong> الأزرق بجانب <strong>عنوان URL</strong>، ثم الصقه في خانة الرابط هنا واضغط <strong>🔍 فحص الاتصال بالشيت</strong>.
                      </li>
                    </ol>
                    <div style={{ marginTop: "8px", color: "#b45309", fontWeight: "bold" }}>
                      💡 بعد هذه الخطوات ستصبح أي حركة أو تغذية أو بيع أو تصدير من الموقع تنعكس في خلايا الشيت وتطابقها لحظياً!
                    </div>
                  </div>
                )}
              </div>
            </div>

            {googleSyncStatus && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: googleSyncStatus.startsWith("✓") ? "#ecfdf5" : "#fef2f2",
                  color: googleSyncStatus.startsWith("✓") ? "#065f46" : "#991b1b",
                  border: googleSyncStatus.startsWith("✓") ? "1px solid #a7f3d0" : "1px solid #fecaca",
                }}
              >
                {googleSyncStatus}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                type="button"
                className="btn-secondary-action"
                style={{ width: "auto" }}
                onClick={() => setShowGoogleSyncModal(false)}
              >
                إغلاق
              </button>

              <button
                type="button"
                disabled={isSyncingGoogle}
                onClick={async () => {
                  if (!googleScriptUrl.trim()) {
                    setGoogleSyncStatus("الرجاء إدخال رابط Web App أولاً");
                    return;
                  }
                  setIsSyncingGoogle(true);
                  setGoogleSyncStatus("جاري فحص الاتصال بشيت جوجل...");
                  try {
                    const res = await fetch("/api/google-sync", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "test_connection",
                        scriptUrl: googleScriptUrl.trim(),
                      }),
                    });
                    const d = await res.json();
                    if (d && d.success) {
                      setGoogleConnected(true);
                      setGoogleSyncStatus("✓ الاتصال بشيت جوجل ناجح وجاهز للتصدير والتحديث الحي!");
                    } else {
                      setGoogleSyncStatus(d?.error || "فشل الاتصال بالشيت. يرجى التأكد من صلاحية الرابط (Anyone).");
                      if (d?.needsScriptUpdate) {
                        setShowScriptGuide(true);
                      }
                    }
                  } catch (err: any) {
                    setGoogleSyncStatus("خطأ في الاتصال: " + err.message);
                  } finally {
                    setIsSyncingGoogle(false);
                  }
                }}
                style={{
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isSyncingGoogle ? "wait" : "pointer",
                }}
              >
                🔍 فحص الاتصال بالشيت
              </button>

              <button
                type="button"
                disabled={isSyncingGoogle}
                onClick={async () => {
                  if (!googleScriptUrl.trim()) {
                    setGoogleSyncStatus("الرجاء إدخال رابط Web App أولاً");
                    return;
                  }
                  setIsSyncingGoogle(true);
                  setGoogleSyncStatus("جاري استيراد وجلب كافة البطاقات من شيت جوجل...");
                  const ok = await syncCardsFromGoogleSheets(googleScriptUrl, true);
                  setIsSyncingGoogle(false);
                  if (ok) {
                    setGoogleSyncStatus("✓ تم استيراد وتحديث كافة البطاقات من شيت جوجل بنجاح!");
                  } else {
                    setGoogleSyncStatus("لم يتم العثور على بطاقات جديدة أو حدث خطأ أثناء الجلب.");
                  }
                }}
                style={{
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isSyncingGoogle ? "wait" : "pointer",
                }}
              >
                📥 جلب البطاقات من الشيت الآن
              </button>

              <button
                type="button"
                disabled={isSyncingGoogle}
                onClick={async () => {
                  if (!googleScriptUrl.trim()) {
                    setGoogleSyncStatus("الرجاء إدخال رابط Web App أولاً");
                    return;
                  }
                  setIsSyncingGoogle(true);
                  setGoogleSyncStatus("جاري تصدير وتحديث أرصدة الخزائن في ورقة أرصدة_الخزائن بشيت جوجل...");
                  try {
                    const res = await syncTreasuryToGoogleSheets(vaults, true);
                    if (res && res.success) {
                      setGoogleSyncStatus(`✓ ${res.message || "تم تصدير وتحديث كافة أرصدة الخزائن في شيت جوجل بنجاح!"}`);
                    } else {
                      setGoogleSyncStatus(
                        res?.error ||
                          "فشل تصدير أرصدة الخزائن. تأكد من تحديث كود Apps Script ونشر إصدار جديد (New version)."
                      );
                      if (res?.needsScriptUpdate) {
                        setShowScriptGuide(true);
                      }
                    }
                  } catch (err: any) {
                    setGoogleSyncStatus("خطأ في تصدير الخزائن: " + err.message);
                  } finally {
                    setIsSyncingGoogle(false);
                  }
                }}
                style={{
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isSyncingGoogle ? "wait" : "pointer",
                }}
              >
                🏦 تصدير أرصدة الخزائن للشيت
              </button>

              <button
                type="button"
                disabled={isSyncingGoogle}
                onClick={async () => {
                  if (!googleScriptUrl.trim()) {
                    setGoogleSyncStatus("الرجاء إدخال رابط Web App أولاً");
                    return;
                  }
                  setIsSyncingGoogle(true);
                  setGoogleSyncStatus("جاري تصدير ومزامنة كافة البطاقات والخزائن إلى شيت جوجل...");
                  try {
                    const res = await fetch("/api/google-sync", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "export_all",
                        scriptUrl: googleScriptUrl.trim(),
                        cards: cards,
                        vaults: vaults,
                        employeeName: `${currentEmployee.name} (${currentEmployee.role})`,
                      }),
                    });
                    const d = await res.json();
                    if (d && d.success) {
                      setGoogleSyncStatus(`✓ ${d.message || "تم تصدير وتحديث البيانات في شيت جوجل بنجاح!"}`);
                    } else {
                      setGoogleSyncStatus(d?.error || "فشل التصدير إلى شيت جوجل. تأكد من إعدادات النشر في Apps Script.");
                    }
                  } catch (err: any) {
                    setGoogleSyncStatus("خطأ في التصدير: " + err.message);
                  } finally {
                    setIsSyncingGoogle(false);
                  }
                }}
                style={{
                  background: "#059669",
                  color: "white",
                  border: "none",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: isSyncingGoogle ? "wait" : "pointer",
                  boxShadow: "0 2px 4px rgba(5, 150, 105, 0.25)",
                }}
              >
                {isSyncingGoogle ? "⏳ جاري التصدير..." : "📤 تصدير وتحديث شيت جوجل الآن"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
