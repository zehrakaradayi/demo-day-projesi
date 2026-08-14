"use client";

import { useState } from "react";
import { BlockConfirmDialog } from "./BlockConfirmDialog";
import { ReportDialog } from "./ReportDialog";

type Props = {
  targetUserId: string;
  targetUserName: string;
};

export function ChatSafetyMenu({ targetUserId, targetUserName }: Props) {
  const [open, setOpen] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-600"
        aria-label="Sohbet seçenekleri"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              setShowReport(true);
            }}
            className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50"
          >
            Şikayet Et
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setShowBlock(true);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-neutral-50"
          >
            Engelle
          </button>
        </div>
      )}
      {showBlock && (
        <BlockConfirmDialog
          targetUserId={targetUserId}
          targetUserName={targetUserName}
          onClose={() => setShowBlock(false)}
        />
      )}
      {showReport && (
        <ReportDialog
          targetUserId={targetUserId}
          targetUserName={targetUserName}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
