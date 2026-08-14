"use client";

import { useState, useTransition } from "react";
import { reportUser } from "../actions";

const REASONS = [
  "Uygunsuz davranış",
  "Taciz / rahatsız edici mesaj",
  "Spam",
  "Sahte profil",
  "Diğer",
];

type Props = {
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
};

export function ReportDialog({ targetUserId, targetUserName, onClose }: Props) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit() {
    startTransition(async () => {
      await reportUser(targetUserId, reason, details || undefined);
      setDone(true);
    });
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        {done ? (
          <>
            <h2 className="text-lg font-semibold">Teşekkürler</h2>
            <p className="mt-2 text-sm text-neutral-600">Raporun alındı, incelenecek.</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white"
            >
              Kapat
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">{targetUserName} kullanıcısını şikayet et</h2>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Ek detay (opsiyonel)"
              rows={3}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {isPending ? "Gönderiliyor..." : "Şikayet Et"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
