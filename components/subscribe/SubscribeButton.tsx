"use client";

import { useState, type ReactNode } from "react";
import { SubscribeModal } from "@/components/subscribe/SubscribeModal";
import { focusRing } from "@/lib/page-data";

interface SubscribeButtonProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function SubscribeButton({
  className,
  children,
  onClick,
}: SubscribeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onClick?.();
          setOpen(true);
        }}
        className={`${className ?? ""} ${focusRing}`}
      >
        {children}
      </button>

      <SubscribeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
