"use client";

import Image from "next/image";

type AuthLayoutProps = {
  children: React.ReactNode;
  variant?: "dark-split";
  /** Enable priority loading for background image (login page only) */
  imagePriority?: boolean;
  /** Optional content rendered after logo on the left (e.g. Back to Login link) */
  headerLeftAddon?: React.ReactNode;
  /** Optional content rendered before Features link on the right (e.g. Already have account?) */
  headerRightAddon?: React.ReactNode;
};

export function AuthLayout({
  children,
  variant = "dark-split",
  imagePriority = false,
  headerLeftAddon,
  headerRightAddon,
}: AuthLayoutProps) {
  if (variant !== "dark-split") {
    return null;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Image
        src="/assets/auth-lifestyle-hd.jpg"
        alt="Entrepreneur reviewing finances with KOMPLEET"
        fill
        priority={imagePriority}
        className="object-cover object-center"
        sizes="100vw"
      />

      <div className="relative z-10 flex h-full w-full">
        <div className="hidden md:block md:w-1/2" />
        <div className="flex w-full items-center justify-center bg-black/65 p-6 md:w-1/2 md:bg-[rgba(0,0,0,0.55)] md:p-8">
          <main className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] md:p-12">
            <div className="mb-6 flex justify-center">
              <Image
                src="/logo.png"
                alt="Kompleet Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </div>

            {(headerLeftAddon || headerRightAddon) && (
              <div className="mb-4 flex items-center justify-between gap-4 text-sm">
                <div>{headerLeftAddon}</div>
                <div>{headerRightAddon}</div>
              </div>
            )}

            <div>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
