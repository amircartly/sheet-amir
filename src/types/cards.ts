export type CardStatus =
  | "إدخال البيانات"
  | "محجوزة"
  | "مودعة"
  | "انتظار شحن"
  | "انتظار الشحن"
  | "مشحونة"
  | "مرسلة للسحب"
  | "تم السحب والتصفية";

export interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date";
  value?: string;
}

export interface BankCardRecord {
  id: string;
  customerName: string;
  nationalId: string;
  cblPhone: string;
  bankName: string;
  accountNumber?: string;
  iban?: string;
  depositAmount: number;
  cardPrice?: number; // سعر شراء البطاقة (د.ل)
  totalCost?: number; // إجمالي التكلفة = الإيداع + سعر البطاقة
  depositDate: string;
  bookingDate: string;
  cardNumber: string;
  cardPin: string;
  pinDollar?: string;
  expiryDate: string;
  notes: string;
  status: CardStatus;
  
  // Deposit specific fields
  depositBank?: string;
  depositAccount?: "خزينة الكاش" | string; // Bank account used to fund the deposit
  depositWarningSeen?: boolean;

  // Withdrawal specific fields
  refNumber?: string;
  withdrawalOffice?: string;
  sentDate?: string;
  withdrawalAmountUSD?: number;

  // Sale specific fields
  usdSoldAmount?: number;
  exchangeRateLYD?: number;
  saleDestinationVault?: "خزينة الكاش" | string;
  totalSaleLYD?: number;
  netProfitLYD?: number;
  completedDate?: string;

  // Extensible custom fields
  customFields?: Record<string, string>;
  createdAt: string;
}

export interface TreasuryState {
  cashVaultLYD: number;
  dollarVaultUSD: number;
  bankAccounts: {
    id: string;
    name: string;
    balanceLYD: number;
  }[];
}
