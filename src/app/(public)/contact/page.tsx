import type { Metadata } from "next";
import ContactFormClient from "@/components/contact/ContactFormClient";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Contact Us | Kompleet",
  description:
    "Get in touch with the Kompleet team for support, partnerships, or inquiries.",
};

export default function ContactPage() {
  return (
    <div
      data-marketing
      className="flex min-h-screen flex-col bg-bg text-text-1"
    >
      <LandingNav />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 sm:px-12">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            Get in touch
          </p>
          <h1 className="font-display mb-4 text-4xl font-bold md:text-5xl">
            Contact us
          </h1>
          <p className="mx-auto max-w-2xl text-base text-text-2">
            A question or a partnership note — we read these.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-8 shadow-1">
              <ContactFormClient />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6 shadow-1">
              <h3 className="font-display mb-2 text-lg font-bold">Email</h3>
              <p className="mb-1 text-sm text-text-2">
                General:{" "}
                <a
                  href="mailto:hi@ivanotechnologies.com"
                  className="font-medium text-primary hover:underline"
                >
                  hi@ivanotechnologies.com
                </a>
              </p>
              <p className="text-sm text-text-2">
                Support:{" "}
                <a
                  href="mailto:support@ivanotechnologies.com"
                  className="font-medium text-primary hover:underline"
                >
                  support@ivanotechnologies.com
                </a>
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 shadow-1">
              <h3 className="font-display mb-2 text-lg font-bold">Office</h3>
              <p className="text-sm leading-relaxed text-text-2">
                Ivano Technologies Ltd
                <br />
                Lagos, Nigeria
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 shadow-1">
              <h3 className="font-display mb-2 text-lg font-bold">
                Response time
              </h3>
              <p className="text-sm leading-relaxed text-text-2">
                Typically within 24 hours on business days.
              </p>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
