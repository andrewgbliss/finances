"use client";

import { Plus, Trash2 } from "lucide-react";
import { RunwayChart } from "@/components/runway-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinanceStore } from "@/hooks/use-finance-store";
import {
  availableCreditCents,
  bpsToPercent,
  centsToDollars,
  dollarsToCents,
  formatCents,
  percentToBps,
} from "@/lib/money";
import { buildRunwayProjection } from "@/lib/runway";

function SaveOnBlurForm({
  onSave,
  children,
}: {
  onSave: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  return (
    <form
      className="min-w-0 flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(new FormData(event.currentTarget));
      }}
      onBlur={(event) => {
        const form = event.currentTarget;
        if (!form.contains(event.relatedTarget as Node | null)) {
          form.requestSubmit();
        }
      }}
    >
      {children}
    </form>
  );
}

function resetAfterSubmit(
  event: React.FormEvent<HTMLFormElement>,
  save: (formData: FormData) => void
): void {
  event.preventDefault();
  const form = event.currentTarget;
  save(new FormData(form));
  form.reset();
}

export function FinancesBoard() {
  const store = useFinanceStore();
  const {
    ready,
    budgets,
    incomes,
    savingsAccounts,
    creditCards,
    transactions,
  } = store;

  const totalIncome = incomes.reduce((sum, row) => sum + row.amountCents, 0);
  const totalBudget = budgets.reduce((sum, row) => sum + row.amountCents, 0);
  const totalSavings = savingsAccounts.reduce(
    (sum, row) => sum + row.amountCents,
    0
  );
  const totalAvailableCredit = creditCards.reduce(
    (sum, card) =>
      sum + availableCreditCents(card.creditLimitCents, card.balanceCents),
    0
  );
  const inTheBank = totalSavings + totalAvailableCredit;
  const totalSpent = transactions.reduce((sum, row) => sum + row.amountCents, 0);
  const remaining = totalIncome - totalSpent;
  const runway = buildRunwayProjection({
    cashOnHandCents: inTheBank,
    budgetCents: totalBudget,
    incomeCents: totalIncome,
    transactions,
  });

  if (!ready) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>In the bank</CardDescription>
            <CardTitle className="text-2xl">{formatCents(inTheBank)}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Savings {formatCents(totalSavings)} plus available credit{" "}
              {formatCents(totalAvailableCredit)}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Income</CardDescription>
            <CardTitle className="text-2xl">{formatCents(totalIncome)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Budget</CardDescription>
            <CardTitle className="text-2xl">{formatCents(totalBudget)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Remaining after spending</CardDescription>
            <CardTitle className="text-2xl">{formatCents(remaining)}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <RunwayChart projection={runway} />

      <Card>
        <CardHeader>
          <CardTitle>Savings accounts</CardTitle>
          <CardDescription>
            Cash balances across accounts. Available credit is added separately to
            In the bank.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {savingsAccounts.map((account) => (
            <div key={account.id} className="flex items-center gap-2">
              <SaveOnBlurForm
                onSave={(formData) => {
                  store.updateSavingsAccount(account.id, {
                    name: String(formData.get("name") ?? "").trim(),
                    amountCents: dollarsToCents(String(formData.get("amount") ?? "0")),
                  });
                }}
              >
                <div className="flex gap-2">
                  <Input
                    name="name"
                    defaultValue={account.name}
                    aria-label="Savings account name"
                  />
                  <Input
                    name="amount"
                    defaultValue={centsToDollars(account.amountCents)}
                    inputMode="decimal"
                    className="w-28"
                    aria-label="Savings account balance"
                  />
                </div>
              </SaveOnBlurForm>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Delete savings account"
                onClick={() => store.removeSavingsAccount(account.id)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(event) =>
              resetAfterSubmit(event, (formData) => {
                store.addSavingsAccount({
                  name: String(formData.get("name") ?? "").trim() || "Savings",
                  amountCents: dollarsToCents(String(formData.get("amount") ?? "0")),
                });
              })
            }
          >
            <Input name="name" placeholder="High-yield savings" required />
            <Input
              name="amount"
              placeholder="0.00"
              inputMode="decimal"
              className="w-28"
              required
            />
            <Button type="submit" size="icon" aria-label="Add savings account">
              <Plus />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit cards</CardTitle>
          <CardDescription>
            Enter the amount on the card, the credit limit, and the interest rate.
            Available credit (limit minus what is on the card) counts toward In the
            bank.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {creditCards.map((card) => (
            <div key={card.id} className="flex items-start gap-2">
              <SaveOnBlurForm
                onSave={(formData) => {
                  store.updateCreditCard(card.id, {
                    name: String(formData.get("name") ?? "").trim(),
                    creditLimitCents: dollarsToCents(
                      String(formData.get("limit") ?? "0")
                    ),
                    balanceCents: dollarsToCents(
                      String(formData.get("balance") ?? "0")
                    ),
                    interestBps: percentToBps(String(formData.get("interest") ?? "0")),
                  });
                }}
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Input
                    name="name"
                    defaultValue={card.name}
                    aria-label="Credit card name"
                  />
                  <Input
                    name="balance"
                    defaultValue={centsToDollars(card.balanceCents)}
                    inputMode="decimal"
                    aria-label="Amount on the card"
                  />
                  <Input
                    name="limit"
                    defaultValue={centsToDollars(card.creditLimitCents)}
                    inputMode="decimal"
                    aria-label="Credit limit"
                  />
                  <Input
                    name="interest"
                    defaultValue={bpsToPercent(card.interestBps)}
                    inputMode="decimal"
                    aria-label="Interest percent"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  On the card {formatCents(card.balanceCents)} · Limit{" "}
                  {formatCents(card.creditLimitCents)} · Available{" "}
                  {formatCents(
                    availableCreditCents(card.creditLimitCents, card.balanceCents)
                  )}{" "}
                  · {bpsToPercent(card.interestBps)}% APR
                </p>
              </SaveOnBlurForm>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Delete credit card"
                onClick={() => store.removeCreditCard(card.id)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <form
            className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_7rem_7rem_5rem_auto]"
            onSubmit={(event) =>
              resetAfterSubmit(event, (formData) => {
                store.addCreditCard({
                  name: String(formData.get("name") ?? "").trim() || "Credit card",
                  creditLimitCents: dollarsToCents(String(formData.get("limit") ?? "0")),
                  balanceCents: dollarsToCents(String(formData.get("balance") ?? "0")),
                  interestBps: percentToBps(String(formData.get("interest") ?? "0")),
                });
              })
            }
          >
            <Input name="name" placeholder="Visa" required />
            <Input
              name="balance"
              placeholder="On card"
              inputMode="decimal"
              required
            />
            <Input
              name="limit"
              placeholder="Limit"
              inputMode="decimal"
              required
            />
            <Input
              name="interest"
              placeholder="APR %"
              inputMode="decimal"
              required
            />
            <Button type="submit" size="icon" aria-label="Add credit card">
              <Plus />
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <CardDescription>Edit a cell, then click away to save.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center gap-2">
                <SaveOnBlurForm
                  onSave={(formData) => {
                    store.updateBudget(budget.id, {
                      category: String(formData.get("category") ?? "").trim(),
                      amountCents: dollarsToCents(String(formData.get("amount") ?? "0")),
                    });
                  }}
                >
                  <div className="flex gap-2">
                    <Input
                      name="category"
                      defaultValue={budget.category}
                      aria-label="Budget category"
                    />
                    <Input
                      name="amount"
                      defaultValue={centsToDollars(budget.amountCents)}
                      inputMode="decimal"
                      className="w-28"
                      aria-label="Budget amount"
                    />
                  </div>
                </SaveOnBlurForm>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label="Delete budget"
                  onClick={() => store.removeBudget(budget.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <form
              className="flex gap-2"
              onSubmit={(event) =>
                resetAfterSubmit(event, (formData) => {
                  store.addBudget({
                    category:
                      String(formData.get("category") ?? "").trim() || "Category",
                    amountCents: dollarsToCents(String(formData.get("amount") ?? "0")),
                  });
                })
              }
            >
              <Input name="category" placeholder="Housing" required />
              <Input
                name="amount"
                placeholder="0.00"
                inputMode="decimal"
                className="w-28"
                required
              />
              <Button type="submit" size="icon" aria-label="Add budget">
                <Plus />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
            <CardDescription>Paychecks, freelance, and other inflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {incomes.map((income) => (
              <div key={income.id} className="flex items-center gap-2">
                <SaveOnBlurForm
                  onSave={(formData) => {
                    store.updateIncome(income.id, {
                      source: String(formData.get("source") ?? "").trim(),
                      amountCents: dollarsToCents(String(formData.get("amount") ?? "0")),
                    });
                  }}
                >
                  <div className="flex gap-2">
                    <Input
                      name="source"
                      defaultValue={income.source}
                      aria-label="Income source"
                    />
                    <Input
                      name="amount"
                      defaultValue={centsToDollars(income.amountCents)}
                      inputMode="decimal"
                      className="w-28"
                      aria-label="Income amount"
                    />
                  </div>
                </SaveOnBlurForm>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label="Delete income"
                  onClick={() => store.removeIncome(income.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <form
              className="flex gap-2"
              onSubmit={(event) =>
                resetAfterSubmit(event, (formData) => {
                  store.addIncome({
                    source: String(formData.get("source") ?? "").trim() || "Income",
                    amountCents: dollarsToCents(String(formData.get("amount") ?? "0")),
                  });
                })
              }
            >
              <Input name="source" placeholder="Salary" required />
              <Input
                name="amount"
                placeholder="0.00"
                inputMode="decimal"
                className="w-28"
                required
              />
              <Button type="submit" size="icon" aria-label="Add income">
                <Plus />
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Spreadsheet</CardTitle>
          <CardDescription>
            Track spending like a ledger. Amounts are stored as integer cents in
            this browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell colSpan={4} className="p-1">
                    <SaveOnBlurForm
                      onSave={(formData) => {
                        store.updateTransaction(transaction.id, {
                          date: String(formData.get("date") ?? ""),
                          description: String(formData.get("description") ?? "").trim(),
                          category: String(formData.get("category") ?? "").trim(),
                          amountCents: dollarsToCents(
                            String(formData.get("amount") ?? "0")
                          ),
                        });
                      }}
                    >
                      <div className="grid grid-cols-[8rem_1fr_9rem_7rem] gap-2">
                        <Input
                          type="date"
                          name="date"
                          defaultValue={transaction.date}
                          aria-label="Transaction date"
                        />
                        <Input
                          name="description"
                          defaultValue={transaction.description}
                          aria-label="Transaction description"
                        />
                        <Input
                          name="category"
                          defaultValue={transaction.category}
                          aria-label="Transaction category"
                        />
                        <Input
                          name="amount"
                          className="text-right"
                          defaultValue={centsToDollars(transaction.amountCents)}
                          inputMode="decimal"
                          aria-label="Transaction amount"
                        />
                      </div>
                    </SaveOnBlurForm>
                  </TableCell>
                  <TableCell className="w-12 p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label="Delete transaction"
                      onClick={() => store.removeTransaction(transaction.id)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <form
            className="grid grid-cols-[8rem_1fr_9rem_7rem_auto] gap-2"
            onSubmit={(event) =>
              resetAfterSubmit(event, (formData) => {
                const today = new Date().toISOString().slice(0, 10);
                store.addTransaction({
                  date: String(formData.get("date") ?? today) || today,
                  description:
                    String(formData.get("description") ?? "").trim() || "New entry",
                  category:
                    String(formData.get("category") ?? "").trim() || "General",
                  amountCents: dollarsToCents(String(formData.get("amount") ?? "0")),
                });
              })
            }
          >
            <Input
              type="date"
              name="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
            <Input name="description" placeholder="Groceries" />
            <Input name="category" placeholder="Food" />
            <Input
              name="amount"
              placeholder="0.00"
              inputMode="decimal"
              className="text-right"
            />
            <Button type="submit">
              <Plus data-icon="inline-start" />
              Add row
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
