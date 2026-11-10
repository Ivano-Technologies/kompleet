#!/usr/bin/env node
/**
 * Light-theme evidence shots for the 10 Nov audit UI follow-up.
 * Visit /dev/theme-shots/audit (localhost-only) and save 1280 + 390x844 PNGs.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.env.SHOT_BASE_URL || "http://localhost:3000";
const SHA = (process.env.SHOT_SHA || "unknown").slice(0, 12);
const OUT = process.env.SHOT_OUT || "/opt/cursor/artifacts";
const VIEWPORTS = [
  { name: "1280", width: 1280, height: 900 },
  { name: "390", width: 390, height: 844 },
];

mkdirSync(OUT, { recursive: true });

function urlFor(view, extra = {}) {
  const params = new URLSearchParams({ view, sha: SHA, ...extra });
  return `${BASE}/dev/theme-shots/audit?${params.toString()}`;
}

async function stamp(page, shotName) {
  await page.addStyleTag({
    content: `
      [data-theme-shot-sha] { font-size: 11px !important; }
      nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }
    `,
  });
  void shotName;
}

async function shot(page, viewport, name, setup) {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });
  await setup();
  await stamp(page, name);
  const file = `${OUT}/${name}_${viewport.name}_${SHA}.png`;
  await page.screenshot({ path: file, fullPage: false });
  console.log(file);
}

async function waitReady(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 20_000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    colorScheme: "light",
  });
  await context.addInitScript(() => {
    window.localStorage.setItem("kompleet.cookie-consent.v1", "denied");
    document.documentElement.classList.remove("dark");
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);

  try {
    for (const vp of VIEWPORTS) {
      await shot(page, vp, "books_menu_mid", async () => {
        await page.goto(urlFor("books"), { waitUntil: "domcontentloaded" });
        await waitReady(page, "GTBank transfer");
        const buttons = page.getByRole("button", { name: "Transaction actions" });
        await buttons.nth(2).click();
        await page.getByRole("menuitem", { name: "Edit" }).waitFor();
      });

      await shot(page, vp, "books_menu_last", async () => {
        await page.goto(urlFor("books"), { waitUntil: "domcontentloaded" });
        await waitReady(page, "Generator diesel");
        const buttons = page.getByRole("button", { name: "Transaction actions" });
        await buttons.last().click();
        await page.getByRole("menuitem", { name: "Delete" }).waitFor();
      });

      await shot(page, vp, "books_categorise", async () => {
        await page.goto(urlFor("books"), { waitUntil: "domcontentloaded" });
        await waitReady(page, "GTBank transfer");
        await page.getByRole("button", { name: "Transaction actions" }).nth(1).click();
        await page.getByRole("menuitem", { name: "Categorise" }).click();
        await page.getByRole("option", { name: "Sales Revenue" }).waitFor();
      });

      await shot(page, vp, "invoices_view_invoice", async () => {
        await page.goto(urlFor("invoices"), { waitUntil: "domcontentloaded" });
        await waitReady(page, "INV-001");
        if (vp.width >= 768) {
          await page.getByRole("button", { name: "View invoice" }).waitFor();
        }
      });

      await shot(page, vp, "invoice_detail_send", async () => {
        await page.goto(urlFor("invoice-detail"), { waitUntil: "domcontentloaded" });
        await waitReady(page, "INV-001");
        await page.getByRole("button", { name: "Send" }).waitFor();
      });

      await shot(page, vp, "invoice_detail_confirm", async () => {
        await page.goto(urlFor("invoice-detail", { state: "confirm" }), {
          waitUntil: "domcontentloaded",
        });
        await page.getByRole("dialog", { name: /Send INV-001 to ada@fixture.test/ }).waitFor();
      });

      await shot(page, vp, "invoice_detail_sent", async () => {
        await page.goto(urlFor("invoice-detail", { state: "sent" }), {
          waitUntil: "domcontentloaded",
        });
        await page.getByRole("status").waitFor();
      });

      await shot(page, vp, "new_invoice_create_client", async () => {
        await page.goto(urlFor("new-invoice"), { waitUntil: "domcontentloaded" });
        await page.getByLabel("Customer").waitFor();
        await page.getByLabel("Customer").fill("Fixture New Client Ltd");
        await page.getByRole("button", { name: /Create “Fixture New Client Ltd”/ }).click();
        await page.getByText("Client name", { exact: false }).waitFor();
      });

      await shot(page, vp, "sidebar_full_name", async () => {
        await page.goto(urlFor("books"), { waitUntil: "domcontentloaded" });
        if (vp.width < 1024) {
          await page.addStyleTag({
            content:
              "aside.hidden { display: flex !important; position: fixed; inset: 0 auto 0 0; z-index: 50; }",
          });
        }
        await page
          .locator("p.font-semibold", { hasText: "Chukwuemeka Okonkwo-Adebayo" })
          .first()
          .waitFor({ state: "visible" });
      });

      await shot(page, vp, "settings_full_name", async () => {
        await page.goto(urlFor("books", { settings: "open" }), {
          waitUntil: "domcontentloaded",
        });
        await page.getByPlaceholder("First and last name").waitFor();
      });

      await shot(page, vp, "export_history_rows", async () => {
        await page.goto(urlFor("export"), { waitUntil: "domcontentloaded" });
        await waitReady(page, "Export History");
        await page.getByText("Expires", { exact: false }).waitFor();
        await page.getByRole("heading", { name: "Export History" }).scrollIntoViewIfNeeded();
      });

      await shot(page, vp, "export_history_empty", async () => {
        await page.goto(urlFor("export-empty"), { waitUntil: "domcontentloaded" });
        await waitReady(page, "No exports yet");
        await page.getByRole("heading", { name: "Export History" }).scrollIntoViewIfNeeded();
      });

      await shot(page, vp, "categories_subheading", async () => {
        await page.goto(urlFor("categories"), { waitUntil: "domcontentloaded" });
        await waitReady(page, "organise your books");
      });
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
