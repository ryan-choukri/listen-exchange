"use client";

import { useState, useTransition } from "react";
import {
  modifyAdminUserCredits,
  type AdminCreditOperation,
} from "@/app/admin/users/actions";
import {
  AdminStatusBadge,
  AdminTable,
} from "@/app/components/admin/AdminUI";
import {
  Button,
  Modal,
  Notice,
  TextField,
} from "@/app/components/ui/design-system";
import type { AdminUserRow } from "@/app/lib/admin/data";
import { formatNumber } from "@/app/lib/admin/format";

const compactDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Paris",
});

function formatCompactDate(value: string) {
  const parts = Object.fromEntries(
    compactDateFormatter
      .formatToParts(new Date(value))
      .map(({ type, value: partValue }) => [type, partValue]),
  );

  return {
    date: `${parts.day}/${parts.month}/${parts.year}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const [rows, setRows] = useState(users);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [operation, setOperation] = useState<AdminCreditOperation>("add");
  const [amount, setAmount] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const numericAmount = Number(amount);
  const validAmount =
    Number.isInteger(numericAmount) &&
    numericAmount >= 1 &&
    numericAmount <= 1_000_000;
  const resultingCredits = selectedUser
    ? operation === "add"
      ? selectedUser.credits + (validAmount ? numericAmount : 0)
      : selectedUser.credits - (validAmount ? numericAmount : 0)
    : 0;
  const canSubmit =
    Boolean(selectedUser) &&
    validAmount &&
    (operation === "add" || resultingCredits >= 0) &&
    !isPending;

  const openModal = (user: AdminUserRow) => {
    setSelectedUser(user);
    setOperation("add");
    setAmount("1");
    setError(null);
  };

  const closeModal = () => {
    if (isPending) return;
    setSelectedUser(null);
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUser || !validAmount) {
      setError("Enter a whole number between 1 and 1,000,000.");
      return;
    }

    if (operation === "remove" && resultingCredits < 0) {
      setError("This removal would make the user's balance negative.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await modifyAdminUserCredits(
        selectedUser.user_id,
        operation,
        numericAmount,
      );

      if (!result.success || result.credits === undefined) {
        setError(result.message);
        return;
      }

      const updatedCredits = result.credits;

      setRows((currentRows) =>
        currentRows.map((user) =>
          user.user_id === selectedUser.user_id
            ? { ...user, credits: updatedCredits }
            : user,
        ),
      );
      setSelectedUser(null);
      setAmount("1");
    });
  };

  return (
    <>
      <div className="[&_th:nth-child(2)]:whitespace-nowrap [&_th:nth-child(3)]:w-px [&_th:nth-child(3)]:px-2 [&_th:nth-child(3)]:text-center [&_th:nth-child(4)]:w-px [&_th:nth-child(4)]:px-2 [&_th:nth-child(4)]:text-center [&_th:nth-child(5)]:w-px [&_th:nth-child(5)]:px-2 [&_th:nth-child(5)]:text-center [&_th:nth-child(6)]:w-px [&_th:nth-child(6)]:px-2 [&_th:nth-child(6)]:text-center [&_th:nth-child(8)]:text-right">
        <AdminTable
          headers={[
            "Email",
            "Signup date",
            "Credits",
            "Tracks",
            "Valid listens",
            "Feedbacks",
            "Status",
            "Actions",
          ]}
          empty={!rows.length}
          minWidth="min-w-[880px]"
          compact
        >
          {rows.map((user) => {
            const signup = formatCompactDate(user.signup_date);

            return (
              <tr
                key={user.user_id}
                className="transition hover:bg-surface-muted/30"
              >
                <td className="max-w-64 truncate px-3 py-3 font-semibold text-ink">
                  {user.email ?? "No email"}
                </td>
                <td className="w-px whitespace-nowrap px-3 py-3 text-center font-mono text-muted">
                  <span className="block text-[11px] leading-4">
                    {signup.date}
                  </span>
                  <span className="block text-[9px] leading-3 text-muted/70">
                    {signup.time}
                  </span>
                </td>
                <td
                  className={`w-px whitespace-nowrap px-2 py-3 text-center font-mono font-black ${user.credits < 0 ? "text-danger" : "text-ink"}`}
                >
                  {formatNumber(user.credits)}
                </td>
                <td className="w-px whitespace-nowrap px-2 py-3 text-center font-mono text-ink">
                  {formatNumber(user.tracks)}
                </td>
                <td className="w-px whitespace-nowrap px-2 py-3 text-center font-mono text-ink">
                  {formatNumber(user.valid_listens)}
                </td>
                <td className="w-px whitespace-nowrap px-2 py-3 text-center font-mono text-ink">
                  {formatNumber(user.feedbacks)}
                </td>
                <td className="w-px whitespace-nowrap px-3 py-3">
                  <AdminStatusBadge status={user.status} />
                </td>
                <td className="w-px whitespace-nowrap px-3 py-3 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon="wallet"
                    onClick={() => openModal(user)}
                  >
                    Modify credits
                  </Button>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </div>

      <Modal
        open={Boolean(selectedUser)}
        onClose={closeModal}
        title="Modify credits"
        description={selectedUser?.email ?? "User without email"}
      >
        {selectedUser ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-control border border-border bg-background p-3">
              <p className="text-xs font-semibold text-muted">
                Current credits
              </p>
              <p
                className={`mt-1 text-3xl font-black ${selectedUser.credits < 0 ? "text-danger" : "text-ink"}`}
              >
                {formatNumber(selectedUser.credits)}
              </p>
            </div>

            <div className="grid grid-cols-2 rounded-control bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setOperation("add");
                  setError(null);
                }}
                disabled={isPending}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-50 ${operation === "add" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                Add credits
              </button>
              <button
                type="button"
                onClick={() => {
                  setOperation("remove");
                  setError(null);
                }}
                disabled={isPending || selectedUser.credits <= 0}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${operation === "remove" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                Remove credits
              </button>
            </div>

            <TextField
              id="admin-credit-amount"
              label="Amount"
              type="number"
              min={1}
              max={operation === "remove" ? selectedUser.credits : 1_000_000}
              step={1}
              inputMode="numeric"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError(null);
              }}
              disabled={isPending}
              error={!validAmount && amount ? "Enter a whole positive number." : undefined}
            />

            {validAmount ? (
              <div className="rounded-control border border-border bg-background p-3 text-sm">
                <p className="flex items-center justify-between gap-4 text-muted">
                  <span>After confirmation</span>
                  <strong
                    className={resultingCredits < 0 ? "text-danger" : "text-ink"}
                  >
                    {formatNumber(resultingCredits)} credits
                  </strong>
                </p>
              </div>
            ) : null}

            {error ? (
              <Notice tone="danger" title="Credits could not be updated">
                {error}
              </Notice>
            ) : null}

            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                loading={isPending}
                className="flex-1"
              >
                Confirm
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
