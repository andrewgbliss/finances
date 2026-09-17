"use client";

import { useCallback, useEffect, useState } from "react";
import {
  emptyFinanceState,
  loadFinanceState,
  saveFinanceState,
  type BudgetRecord,
  type CreditCardRecord,
  type FinanceState,
  type IncomeRecord,
  type SavingsAccountRecord,
  type TransactionRecord,
} from "@/lib/finance-store";

export function useFinanceStore() {
  const [state, setState] = useState<FinanceState>(emptyFinanceState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadFinanceState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    saveFinanceState(state);
  }, [ready, state]);

  const addBudget = useCallback((values: Omit<BudgetRecord, "id">) => {
    setState((current) => {
      const row: BudgetRecord = {
        id: current.nextId,
        category: values.category,
        amountCents: values.amountCents,
      };
      return {
        ...current,
        nextId: current.nextId + 1,
        budgets: [...current.budgets, row],
      };
    });
  }, []);

  const updateBudget = useCallback(
    (id: number, values: Partial<Omit<BudgetRecord, "id">>) => {
      setState((current) => ({
        ...current,
        budgets: current.budgets.map((row) =>
          row.id === id ? { ...row, ...values } : row
        ),
      }));
    },
    []
  );

  const removeBudget = useCallback((id: number) => {
    setState((current) => ({
      ...current,
      budgets: current.budgets.filter((row) => row.id !== id),
    }));
  }, []);

  const addIncome = useCallback((values: Omit<IncomeRecord, "id">) => {
    setState((current) => {
      const row: IncomeRecord = {
        id: current.nextId,
        source: values.source,
        amountCents: values.amountCents,
      };
      return {
        ...current,
        nextId: current.nextId + 1,
        incomes: [...current.incomes, row],
      };
    });
  }, []);

  const updateIncome = useCallback(
    (id: number, values: Partial<Omit<IncomeRecord, "id">>) => {
      setState((current) => ({
        ...current,
        incomes: current.incomes.map((row) =>
          row.id === id ? { ...row, ...values } : row
        ),
      }));
    },
    []
  );

  const removeIncome = useCallback((id: number) => {
    setState((current) => ({
      ...current,
      incomes: current.incomes.filter((row) => row.id !== id),
    }));
  }, []);

  const addSavingsAccount = useCallback(
    (values: Omit<SavingsAccountRecord, "id">) => {
      setState((current) => {
        const row: SavingsAccountRecord = {
          id: current.nextId,
          name: values.name,
          amountCents: values.amountCents,
        };
        return {
          ...current,
          nextId: current.nextId + 1,
          savingsAccounts: [...current.savingsAccounts, row],
        };
      });
    },
    []
  );

  const updateSavingsAccount = useCallback(
    (id: number, values: Partial<Omit<SavingsAccountRecord, "id">>) => {
      setState((current) => ({
        ...current,
        savingsAccounts: current.savingsAccounts.map((row) =>
          row.id === id ? { ...row, ...values } : row
        ),
      }));
    },
    []
  );

  const removeSavingsAccount = useCallback((id: number) => {
    setState((current) => ({
      ...current,
      savingsAccounts: current.savingsAccounts.filter((row) => row.id !== id),
    }));
  }, []);

  const addCreditCard = useCallback((values: Omit<CreditCardRecord, "id">) => {
    setState((current) => {
      const row: CreditCardRecord = {
        id: current.nextId,
        name: values.name,
        creditLimitCents: values.creditLimitCents,
        balanceCents: values.balanceCents,
        interestBps: values.interestBps,
      };
      return {
        ...current,
        nextId: current.nextId + 1,
        creditCards: [...current.creditCards, row],
      };
    });
  }, []);

  const updateCreditCard = useCallback(
    (id: number, values: Partial<Omit<CreditCardRecord, "id">>) => {
      setState((current) => ({
        ...current,
        creditCards: current.creditCards.map((row) =>
          row.id === id ? { ...row, ...values } : row
        ),
      }));
    },
    []
  );

  const removeCreditCard = useCallback((id: number) => {
    setState((current) => ({
      ...current,
      creditCards: current.creditCards.filter((row) => row.id !== id),
    }));
  }, []);

  const addTransaction = useCallback((values: Omit<TransactionRecord, "id">) => {
    setState((current) => {
      const row: TransactionRecord = {
        id: current.nextId,
        date: values.date,
        description: values.description,
        category: values.category,
        amountCents: values.amountCents,
      };
      return {
        ...current,
        nextId: current.nextId + 1,
        transactions: [...current.transactions, row],
      };
    });
  }, []);

  const updateTransaction = useCallback(
    (id: number, values: Partial<Omit<TransactionRecord, "id">>) => {
      setState((current) => ({
        ...current,
        transactions: current.transactions.map((row) =>
          row.id === id ? { ...row, ...values } : row
        ),
      }));
    },
    []
  );

  const removeTransaction = useCallback((id: number) => {
    setState((current) => ({
      ...current,
      transactions: current.transactions.filter((row) => row.id !== id),
    }));
  }, []);

  return {
    ready,
    budgets: state.budgets,
    incomes: state.incomes,
    savingsAccounts: state.savingsAccounts,
    creditCards: state.creditCards,
    transactions: state.transactions,
    addBudget,
    updateBudget,
    removeBudget,
    addIncome,
    updateIncome,
    removeIncome,
    addSavingsAccount,
    updateSavingsAccount,
    removeSavingsAccount,
    addCreditCard,
    updateCreditCard,
    removeCreditCard,
    addTransaction,
    updateTransaction,
    removeTransaction,
  };
}
