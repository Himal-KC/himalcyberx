"use client";

import { useState } from "react";
import type { Subscriber } from "@/lib/supabase/types";
import { SubscriberStatusButton } from "@/components/admin/subscribers/SubscriberStatusButton";
import { SubscriberViewModal } from "@/components/admin/subscribers/SubscriberViewModal";
import { focusRing } from "@/lib/page-data";

interface SubscriberRowActionsProps {
  subscriber: Subscriber;
  onSuccess?: (message: string) => void;
}

export function SubscriberRowActions({
  subscriber,
  onSuccess,
}: SubscriberRowActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => setViewOpen(true)}
          className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
        >
          View
        </button>

        {subscriber.status === "active" ? (
          <SubscriberStatusButton
            subscriberId={subscriber.id}
            subscriberEmail={subscriber.email}
            nextStatus="unsubscribed"
            label="Unsubscribe"
            confirmTitle="Unsubscribe subscriber?"
            confirmMessage="This subscriber will no longer receive newsletter emails."
            confirmVariant="destructive"
            className={`text-sm text-hcx-orange transition-opacity hover:opacity-80 ${focusRing}`}
            onSuccess={() => onSuccess?.("Subscriber unsubscribed successfully.")}
          />
        ) : (
          <SubscriberStatusButton
            subscriberId={subscriber.id}
            subscriberEmail={subscriber.email}
            nextStatus="active"
            label="Reactivate"
            confirmTitle="Reactivate subscriber?"
            confirmMessage="This subscriber will be marked as active again."
            confirmVariant="primary"
            className={`text-sm text-hcx-cyan transition-opacity hover:opacity-80 ${focusRing}`}
            onSuccess={() => onSuccess?.("Subscriber reactivated successfully.")}
          />
        )}
      </div>

      {viewOpen && (
        <SubscriberViewModal
          subscriber={subscriber}
          onClose={() => setViewOpen(false)}
        />
      )}
    </>
  );
}
