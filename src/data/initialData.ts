import { BankCardRecord, TreasuryState } from "@/types/cards";

export const INITIAL_TREASURY: TreasuryState = {
  cashVaultLYD: 0,
  dollarVaultUSD: 0,
  bankAccounts: [
    { id: "bank_1", name: "مصرف التجارة والتنمية", balanceLYD: 0 },
    { id: "bank_2", name: "مصرف الوحدة", balanceLYD: 0 },
    { id: "bank_3", name: "المصرف التجاري الوطني", balanceLYD: 0 },
    { id: "bank_4", name: "مصرف الأمان", balanceLYD: 0 },
    { id: "bank_5", name: "مصرف الجمهورية", balanceLYD: 0 },
    { id: "bank_6", name: "مصرف المتوسط", balanceLYD: 0 },
  ],
};

export const INITIAL_CARDS: BankCardRecord[] = [];
