"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {
  emptyBusinessProfile,
  type BusinessProfile,
} from "@/lib/invoices/profiles";
import { onBusinessProfileChanged } from "@/lib/invoices/profile-events";
import {
  checklistBannerSessionKey,
  checklistCompleteAckKey,
  checklistDoneCount,
  checklistItems,
  checklistSoftKey,
  checklistSurface,
  readStorageFlag,
  writeStorageFlag,
} from "@/lib/invoices/setup-checklist";
import { SetupChecklistCard } from "./SetupChecklistCard";
import { SetupSoftBanner } from "./SetupSoftBanner";
import { SETUP_COPY } from "./setup-copy";

function browserStorage(kind: "local" | "session"): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function SetupChecklist({ userId }: { userId: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [softDismissed, setSoftDismissed] = useState(false);
  const [bannerSessionDismissed, setBannerSessionDismissed] = useState(false);
  const [completeAck, setCompleteAck] = useState(false);
  const [sawIncomplete, setSawIncomplete] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/business-profile", { credentials: "include" });
      if (!res.ok) return;
      const body = (await res.json()) as { profile?: BusinessProfile };
      if (body.profile) {
        setProfile({ ...emptyBusinessProfile(), ...body.profile });
      } else {
        setProfile(emptyBusinessProfile());
      }
    } catch {
      /* dashboard remains usable without the checklist */
    }
  }, []);

  useEffect(() => {
    setSoftDismissed(readStorageFlag(browserStorage("local"), checklistSoftKey(userId)));
    setCompleteAck(
      readStorageFlag(browserStorage("local"), checklistCompleteAckKey(userId)),
    );
    setBannerSessionDismissed(
      readStorageFlag(browserStorage("session"), checklistBannerSessionKey(userId)),
    );
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    void loadProfile();
    return onBusinessProfileChanged(() => {
      void loadProfile();
    });
  }, [loadProfile]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const surface = hydrated
    ? checklistSurface({
        profile,
        softDismissed,
        bannerSessionDismissed,
        completeAck,
        sawIncomplete,
      })
    : "hidden";

  useEffect(() => {
    if (surface === "card") setSawIncomplete(true);
  }, [surface]);

  useEffect(() => {
    if (surface !== "complete") return;
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 6000);
  }, [surface]);

  const openBusinessSettings = () => {
    router.push("/dashboard?settings=business");
  };

  const softDismiss = () => {
    writeStorageFlag(browserStorage("local"), checklistSoftKey(userId));
    setSoftDismissed(true);
  };

  const dismissBanner = () => {
    writeStorageFlag(browserStorage("session"), checklistBannerSessionKey(userId));
    setBannerSessionDismissed(true);
  };

  const ackComplete = () => {
    writeStorageFlag(browserStorage("local"), checklistCompleteAckKey(userId));
    setCompleteAck(true);
    setShowToast(false);
  };

  if (!profile || surface === "hidden") return null;

  const items = checklistItems(profile);
  const doneCount = checklistDoneCount(profile);

  return (
    <div className="flex flex-col gap-4">
      {showToast && surface === "complete" && (
        <div
          role="status"
          className="self-center bg-text-1 text-[#F0F9FF] text-[13px] font-medium px-4 py-2.5 rounded-[10px] shadow-3 flex items-center gap-2.5"
        >
          <span className="w-5 h-5 rounded-full bg-success text-white text-[11px] font-bold flex items-center justify-center">
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
          {SETUP_COPY.toastComplete}
        </div>
      )}
      {surface === "banner" && (
        <SetupSoftBanner onSetup={openBusinessSettings} onDismiss={dismissBanner} />
      )}
      {(surface === "card" || surface === "complete") && (
        <SetupChecklistCard
          items={items}
          doneCount={doneCount}
          variant={surface === "complete" ? "complete" : "progress"}
          onSetup={openBusinessSettings}
          onSoftDismiss={softDismiss}
          onCompleteAck={ackComplete}
        />
      )}
    </div>
  );
}
