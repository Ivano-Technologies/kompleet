import {
  hasLegalName,
  isBusinessProfileComplete,
  trimToEmpty,
  type BusinessProfile,
} from "./profiles";

export const CHECKLIST_ITEM_COUNT = 4;

export type ChecklistItemId = "legalName" | "address" | "contact" | "tax";

export type ChecklistItem = {
  id: ChecklistItemId;
  done: boolean;
  optional: boolean;
};

export type ChecklistSurface = "card" | "banner" | "complete" | "hidden";

export function isAddressDone(
  profile: Pick<BusinessProfile, "addressLine1" | "city">,
): boolean {
  return (
    trimToEmpty(profile.addressLine1).length > 0 &&
    trimToEmpty(profile.city).length > 0
  );
}

export function isContactDone(
  profile: Pick<BusinessProfile, "email" | "phone">,
): boolean {
  return (
    trimToEmpty(profile.email).length > 0 ||
    trimToEmpty(profile.phone).length > 0
  );
}

export function isTaxDone(
  profile: Pick<BusinessProfile, "tin" | "vatNumber">,
): boolean {
  return (
    trimToEmpty(profile.tin).length > 0 ||
    trimToEmpty(profile.vatNumber).length > 0
  );
}

export function checklistItems(profile: BusinessProfile): ChecklistItem[] {
  return [
    { id: "legalName", done: hasLegalName(profile), optional: false },
    { id: "address", done: isAddressDone(profile), optional: false },
    { id: "contact", done: isContactDone(profile), optional: false },
    { id: "tax", done: isTaxDone(profile), optional: true },
  ];
}

export function checklistDoneCount(profile: BusinessProfile): number {
  return checklistItems(profile).filter((item) => item.done).length;
}

export function isSetupPermanentlyComplete(
  profile: Pick<BusinessProfile, "legalName" | "addressLine1" | "city">,
): boolean {
  return isBusinessProfileComplete(profile);
}

export function checklistSoftKey(userId: string): string {
  return `kompleet:setup-checklist:soft:${userId}`;
}

export function checklistCompleteAckKey(userId: string): string {
  return `kompleet:setup-checklist:complete-ack:${userId}`;
}

export function readStorageFlag(
  storage: Pick<Storage, "getItem"> | undefined,
  key: string,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(key) != null;
  } catch {
    return false;
  }
}

export function writeStorageFlag(
  storage: Pick<Storage, "setItem"> | undefined,
  key: string,
  value: string = String(Date.now()),
): void {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    /* private mode / quota — dismiss is best-effort */
  }
}

export function checklistSurface(args: {
  profile: BusinessProfile | null;
  softDismissed: boolean;
  bannerSessionDismissed: boolean;
  completeAck: boolean;
  sawIncomplete: boolean;
}): ChecklistSurface {
  const { profile, softDismissed, bannerSessionDismissed, completeAck, sawIncomplete } =
    args;
  if (!profile) return "hidden";

  if (isSetupPermanentlyComplete(profile)) {
    if (completeAck) return "hidden";
    if (sawIncomplete) return "complete";
    return "hidden";
  }

  if (!softDismissed) return "card";

  if (!hasLegalName(profile) && !bannerSessionDismissed) return "banner";

  return "hidden";
}
