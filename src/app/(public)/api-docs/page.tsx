import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Developer API | KOMPLEET",
  description:
    "KOMPLEET API documentation for developers integrating with the platform.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/dashboard/summary",
    description:
      "Retrieve dashboard summary including revenue, tax obligations, and invoice counts.",
  },
  {
    method: "GET",
    path: "/api/v1/records",
    description:
      "List financial records with pagination and filtering support.",
  },
  {
    method: "GET",
    path: "/api/v1/records/:id",
    description: "Retrieve a specific financial record by ID.",
  },
  {
    method: "GET",
    path: "/api/transactions",
    description:
      "List transactions with category, date range, and status filters.",
  },
  {
    method: "POST",
    path: "/api/invoices/create",
    description: "Create a new invoice with automatic VAT calculation.",
  },
  {
    method: "POST",
    path: "/api/calculations/save",
    description: "Save a tax calculation with input parameters and results.",
  },
  {
    method: "POST",
    path: "/api/tax-reports/generate",
    description: "Generate a tax report for a specified period and tax type.",
  },
  {
    method: "GET",
    path: "/api/export/transactions",
    description: "Export transactions in CSV or PDF format.",
  },
];

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Developer API
          </h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Integrate KOMPLEET into your applications with our REST API. Access
            tax calculations, invoicing, transactions, and reporting
            programmatically.
          </p>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Authentication
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            All API requests require authentication via a Bearer token. Obtain
            your token by authenticating through the Supabase auth endpoint.
          </p>
          <div className="bg-dark-background rounded-lg p-4 text-sm font-mono">
            <p className="text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
              # Example request header
            </p>
            <p className="text-green-400">
              Authorization: Bearer {"<your-access-token>"}
            </p>
            <p className="text-green-400">Content-Type: application/json</p>
          </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Base URL
          </h2>
          <div className="bg-dark-background rounded-lg p-4 text-sm font-mono">
            <p className="text-green-400">https://kompleet.vercel.app/api</p>
          </div>
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-2">
            All endpoints are relative to this base URL.
          </p>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
            Key Endpoints
          </h2>
          <div className="space-y-4">
            {endpoints.map((ep, index) => (
              <div
                key={index}
                className="border border-light-border dark:border-dark-border rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      ep.method === "GET"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-sm text-light-text-primary dark:text-dark-text-primary font-mono">
                    {ep.path}
                  </code>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {ep.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Rate Limiting
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            API requests are rate-limited to ensure fair usage. Current limits:
          </p>
          <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary space-y-2">
            <li>Standard endpoints: 100 requests per minute</li>
            <li>Export endpoints: 10 requests per minute</li>
            <li>AI-powered endpoints: 20 requests per minute</li>
          </ul>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-4">
            Rate limit headers (
            <code className="text-sm bg-light-background dark:bg-dark-background px-1 rounded">
              X-RateLimit-Limit
            </code>
            ,{" "}
            <code className="text-sm bg-light-background dark:bg-dark-background px-1 rounded">
              X-RateLimit-Remaining
            </code>
            ) are included in all responses.
          </p>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Error Handling
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            Errors follow a consistent JSON format:
          </p>
          <div className="bg-dark-background rounded-lg p-4 text-sm font-mono">
            <p className="text-light-text-tertiary dark:text-dark-text-tertiary">
              {"{"}
            </p>
            <p className="text-green-400 pl-4">{'"error": "Unauthorized",'}</p>
            <p className="text-green-400 pl-4">
              {'"message": "Invalid or expired token",'}
            </p>
            <p className="text-green-400 pl-4">{'"status": 401'}</p>
            <p className="text-light-text-tertiary dark:text-dark-text-tertiary">
              {"}"}
            </p>
          </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            Need help with the API?
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            Our team is available to help with integration questions.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-green-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-800 transition-colors"
          >
            Contact Developer Support
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
            &copy; 2026 Ivano Technologies Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
