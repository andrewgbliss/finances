export type BudgetRecord = {
  id: number;
  category: string;
  amountCents: number;
};

export type IncomeRecord = {
  id: number;
  source: string;
  amountCents: number;
};

export type SavingsAccountRecord = {
  id: number;
  name: string;
  amountCents: number;
};

export type CreditCardRecord = {
  id: number;
  name: string;
  creditLimitCents: number;
  balanceCents: number;
  interestBps: number;
};

export type TransactionRecord = {
  id: number;
  date: string;
  description: string;
  category: string;
  amountCents: number;
};

export type FinanceState = {
  nextId: number;
  budgets: BudgetRecord[];
  incomes: IncomeRecord[];
  savingsAccounts: SavingsAccountRecord[];
  creditCards: CreditCardRecord[];
  transactions: TransactionRecord[];
};

export const FINANCE_STORAGE_KEY = "ledger.finances.v1";

export const emptyFinanceState: FinanceState = {
  nextId: 1,
  budgets: [],
  incomes: [],
  savingsAccounts: [],
  creditCards: [],
  transactions: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseBudgets(value: unknown): BudgetRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    return [
      {
        id: asNumber(item.id),
        category: asString(item.category),
        amountCents: asNumber(item.amountCents),
      },
    ];
  });
}

function parseIncomes(value: unknown): IncomeRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    return [
      {
        id: asNumber(item.id),
        source: asString(item.source),
        amountCents: asNumber(item.amountCents),
      },
    ];
  });
}

function parseSavings(value: unknown): SavingsAccountRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    return [
      {
        id: asNumber(item.id),
        name: asString(item.name),
        amountCents: asNumber(item.amountCents),
      },
    ];
  });
}

function parseCards(value: unknown): CreditCardRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    return [
      {
        id: asNumber(item.id),
        name: asString(item.name),
        creditLimitCents: asNumber(item.creditLimitCents),
        balanceCents: asNumber(item.balanceCents),
        interestBps: asNumber(item.interestBps),
      },
    ];
  });
}

function parseTransactions(value: unknown): TransactionRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    return [
      {
        id: asNumber(item.id),
        date: asString(item.date),
        description: asString(item.description),
        category: asString(item.category),
        amountCents: asNumber(item.amountCents),
      },
    ];
  });
}

export function parseFinanceState(value: unknown): FinanceState {
  if (!isRecord(value)) {
    return emptyFinanceState;
  }

  const budgets = parseBudgets(value.budgets);
  const incomes = parseIncomes(value.incomes);
  const savingsAccounts = parseSavings(value.savingsAccounts);
  const creditCards = parseCards(value.creditCards);
  const transactions = parseTransactions(value.transactions);
  const maxId = Math.max(
    0,
    ...budgets.map((row) => row.id),
    ...incomes.map((row) => row.id),
    ...savingsAccounts.map((row) => row.id),
    ...creditCards.map((row) => row.id),
    ...transactions.map((row) => row.id)
  );

  return {
    nextId: Math.max(asNumber(value.nextId, 1), maxId + 1),
    budgets,
    incomes,
    savingsAccounts,
    creditCards,
    transactions,
  };
}

export function loadFinanceState(): FinanceState {
  if (typeof window === "undefined") {
    return emptyFinanceState;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_STORAGE_KEY);
    if (!raw) {
      return emptyFinanceState;
    }
    return parseFinanceState(JSON.parse(raw));
  } catch {
    return emptyFinanceState;
  }
}

export function saveFinanceState(state: FinanceState): void {
  window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(state));
}
