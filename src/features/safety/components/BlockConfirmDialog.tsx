"use client";

import { useTransition } from "react";
import { blockUser } from "../actions";

type Props = {
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
};

export function BlockConfirmDialog({ targetUserId, targetUserName, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await blockUser(targetUserId);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold">{targetUserName} engellensin mi?</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Engellediğinde artık birbirinize mesaj gönderemezsiniz.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm"
          >
            Vazgeç
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Engelleniyor..." : "Engelle"}
          </button>
        </div>
      </div>
    </div>
  );
}
