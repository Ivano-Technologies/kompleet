"use client";

import Image from "next/image";

type AuthLayoutProps = {
  children: React.ReactNode;
  /** Enable priority loading for background image (login page only) */
  imagePriority?: boolean;
  /** Optional content rendered after logo on the left (e.g. Back to Login link) */
  headerLeftAddon?: React.ReactNode;
  /** Optional content rendered before Features link on the right (e.g. Already have account?) */
  headerRightAddon?: React.ReactNode;
};

export function AuthLayout({
  children,
  imagePriority = false,
  headerLeftAddon,
  headerRightAddon,
}: AuthLayoutProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      {/* Desktop full-page background image */}
      <Image
        src="/assets/auth-lifestyle-hd.jpg"
        alt="Entrepreneur reviewing finances with KOMPLEET"
        fill
        priority={imagePriority}
        className="hidden object-cover md:block"
        sizes="100vw"
      />

      {/* Desktop right-side 70% white overlay */}
      <div
        className="absolute inset-y-0 right-0 hidden w-1/2 md:block"
        style={{ background: "rgba(255, 255, 255, 0.7)" }}
      />

      {/* Content layer */}
      <div className="relative z-10 h-full">
        <div className="h-full md:ml-auto md:w-1/2">
          <div className="flex h-full items-center justify-center bg-white px-6 py-8 md:bg-transparent md:px-8">
            <main className="w-full max-w-[420px]">
              {(headerLeftAddon || headerRightAddon) && (
                <div className="mb-6 flex items-center justify-between text-sm">
                  <div>{headerLeftAddon}</div>
                  <div>{headerRightAddon}</div>
                </div>
              )}
              {!headerLeftAddon && !headerRightAddon && (
                <div className="mb-6 flex justify-center">
                  <Image
                    src="/logo.png"
                    alt="Kompleet Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </div>
              )}
              <div>{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
