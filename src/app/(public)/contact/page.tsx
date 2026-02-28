import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex flex-col">
      <LandingNav />

      <main className="flex-1 py-16 px-6 sm:px-12 md:px-24 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
            Get in Touch
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Contact Us
          </h1>
          <p className="text-base text-[rgb(var(--text-secondary))] max-w-2xl mx-auto">
            Have a question or need help? We would love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <div className="bg-[rgb(var(--surface))] rounded-lg p-8 shadow-1 border border-[rgb(var(--border))]">
              <ContactFormClient />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[rgb(var(--surface))] rounded-lg p-6 shadow-1 border border-[rgb(var(--border))]">
              <h3 className="font-display font-bold text-lg mb-2">
                Email Us
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] mb-1">
                General:{" "}
                <a
                  href="mailto:hi@kompleet.com"
                  className="text-primary hover:underline font-medium"
                >
                  hi@kompleet.com
                </a>
              </p>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                Support:{" "}
                <a
                  href="mailto:support@kompleet.com"
                  className="text-primary hover:underline font-medium"
                >
                  support@kompleet.com
                </a>
              </p>
            </div>

            <div className="bg-[rgb(var(--surface))] rounded-lg p-6 shadow-1 border border-[rgb(var(--border))]">
              <h3 className="font-display font-bold text-lg mb-2">
                Office
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
                Ivano Technologies Ltd
                <br />
                Lagos, Nigeria
              </p>
            </div>

            <div className="bg-[rgb(var(--surface))] rounded-lg p-6 shadow-1 border border-[rgb(var(--border))]">
              <h3 className="font-display font-bold text-lg mb-2">
                Response Time
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
                We typically respond within 24 hours on business days.
              </p>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
