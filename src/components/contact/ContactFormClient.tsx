"use client";

import { useState } from "react";

export default function ContactFormClient() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(json.error || "Failed to send message.");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1"
        >
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-light-text-primary dark:text-dark-text-primary"
          placeholder="Your full name"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-light-text-primary dark:text-dark-text-primary"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1"
        >
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-light-text-primary dark:text-dark-text-primary"
        >
          <option value="">Select a subject</option>
          <option value="general">General Inquiry</option>
          <option value="support">Technical Support</option>
          <option value="billing">Billing &amp; Account</option>
          <option value="partnership">Partnership</option>
          <option value="feedback">Feedback</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-light-text-primary dark:text-dark-text-primary"
          placeholder="How can we help you?"
        />
      </div>
      {status === "success" && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Thank you! Your message has been sent. We&apos;ll respond within 24
          hours.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-green-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
