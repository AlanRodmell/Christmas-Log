export interface Recipient {
  id: string;
  name: string;
  budget: number;
  note?: string;
  createdAt: number;
}

export interface GiftEntry {
  id: string;
  recipientId: string;
  description: string;
  estimatedCost: number;
  purchased: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChristmasLedgerData {
  recipients: Recipient[];
  gifts: GiftEntry[];
}

export type AppView = 'gifts' | 'summary' | 'recipients';

export type SortMode = 'recent' | 'cost-desc' | 'cost-asc' | 'unbought';
