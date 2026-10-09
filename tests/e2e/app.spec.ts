import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function onboard(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByLabel("Preferred name").fill("Ava");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("First day of your last period").fill("2026-09-20");
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Meet your Lunara" }).click();
  await expect(page.getByRole("heading", { name: /Good .*Ava/ })).toBeVisible();
}
async function tab(
  page: import("@playwright/test").Page,
  name: string,
  wait = true,
) {
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name, exact: true })
    .click();
  if (!wait) return;
  const titles: Record<string, string | RegExp> = {
    Home: /Good .*Ava/,
    Calendar: "The cycle calendar",
    Log: "Your daily check-in",
    Insights: "Your patterns",
    Settings: "Your Lunara",
  };
  await expect(
    page.getByRole("heading", { name: titles[name], exact: true }),
  ).toBeVisible();
  await expect(page.locator(".main-content > div")).toHaveCSS("opacity", "1");
}
test("onboarding, editable periods, symptoms, persistence and calendar navigation", async ({
  page,
}) => {
  await onboard(page);
  await tab(page, "Calendar");
  await page.getByRole("button", { name: /Through|Ongoing/ }).click();
  await page.getByLabel("Last day").fill("2026-09-24");
  await page.getByRole("button", { name: "Save period", exact: true }).click();
  await expect(page.getByRole("button", { name: /Through/ })).toBeVisible();
  await tab(page, "Log");
  await page.getByRole("button", { name: "Cramps", exact: true }).click();
  await page.getByRole("button", { name: "Cramps: 4 of 5" }).click();
  await page.getByRole("button", { name: "Calm", exact: true }).click();
  await page.getByLabel("Personal notes").fill("A restful day.");
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Your check-in is saved." }),
  ).toBeVisible();
  await page.reload();
  await tab(page, "Log");
  await expect(page.getByLabel("Personal notes")).toHaveValue("A restful day.");
  await expect(
    page.getByRole("button", { name: "Cramps: 4 of 5" }),
  ).toHaveAttribute("aria-pressed", "true");
  await tab(page, "Calendar");
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(page.locator(".month-title h2")).not.toHaveText(
    new Date().toLocaleString("en", { month: "long" }),
  );
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: /Through/ }).click();
  await page.getByRole("button", { name: "Delete this period" }).click();
  await page.getByRole("button", { name: "Confirm deletion" }).click();
  await expect(
    page.getByText("Your history starts with your first confirmed period."),
  ).toBeVisible();
});
test("backup download, invalid import, preview and confirmed restoration", async ({
  page,
}) => {
  await onboard(page);
  await tab(page, "Settings");
  await page.getByLabel("Password-protected backup").uncheck();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.getByLabel("Import backup file").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken"),
  });
  await expect(page.getByRole("alert")).toContainText("not valid JSON");
  await page.getByLabel("Import backup file").setInputFiles(path!);
  await expect(
    page.getByRole("dialog", { name: "Review your backup" }),
  ).toBeVisible();
  await page.getByLabel("Restore method").selectOption("replace");
  await page.getByRole("button", { name: "Confirm replacement" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Backup restored." }),
  ).toBeVisible();
  await page.getByLabel("Appearance").selectOption("dark");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Delete all data & reset Lunara" })
    .click();
  await page.getByRole("button", { name: "Delete everything & reset" }).click();
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
});
test("offline shell, lazy screens, and persistent records", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit does not support service worker inspection. Offline shell is covered in Chromium.",
  );
  await onboard(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Good .*Ava/ })).toBeVisible();
  await tab(page, "Log");
  await page.getByLabel("Personal notes").fill("Offline note");
  await page.getByRole("button", { name: "Save check-in" }).click();
  await tab(page, "Insights");
  await expect(
    page.getByRole("heading", { name: "Your patterns" }),
  ).toBeVisible();
  await tab(page, "Settings");
  await expect(
    page.getByRole("heading", { name: "Your Lunara" }),
  ).toBeVisible();
  await page.reload();
  await tab(page, "Log");
  await expect(page.getByLabel("Personal notes")).toHaveValue("Offline note");
  await context.setOffline(false);
});
test("mobile accessibility, dark mode, and screen widths", async ({ page }) => {
  await page.goto("/");
  let results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await onboard(page);
  for (const name of ["Home", "Calendar", "Log", "Insights", "Settings"]) {
    await tab(page, name);
    await expect(page.locator(".main-content h1")).toBeVisible();
    await expect(page.locator(".main-content > div")).toHaveCSS("opacity", "1");
    results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByLabel("Appearance").selectOption("dark");
  await page.getByRole("button", { name: "Save preferences" }).click();
  for (const name of ["Home", "Calendar", "Log", "Insights", "Settings"]) {
    await tab(page, name);
    await expect(page.locator(".main-content > div")).toHaveCSS("opacity", "1");
    results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, `Dark ${name}`).toEqual([]);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/settings-iphone.png",
    fullPage: true,
  });
  await tab(page, "Home");
  await page.screenshot({
    path: "test-results/home-iphone.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
});

test("storage failure is explicit and offers retry without resetting records", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(IDBFactory.prototype, "open", {
      configurable: true,
      value() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "local storage could not be opened",
  );
  await expect(
    page.getByRole("button", { name: "Retry storage" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toHaveCount(
    0,
  );
});

test("unsaved edits are kept when navigation is cancelled", async ({
  page,
}) => {
  await onboard(page);
  await tab(page, "Log");
  await page.getByLabel("Personal notes").fill("Keep this draft");
  page.once("dialog", (d) => d.dismiss());
  await tab(page, "Home", false);
  await expect(page.getByLabel("Personal notes")).toHaveValue(
    "Keep this draft",
  );
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Your check-in is saved." }),
  ).toBeVisible();
  await tab(page, "Home");
  await expect(page.getByRole("heading", { name: /Good .*Ava/ })).toBeVisible();
});

test("recorded history drives interactive insights and reports with opt-in notes", async ({
  page,
}) => {
  await onboard(page);
  await tab(page, "Settings");
  const settings = {
    name: "Ava",
    cycleLength: 28,
    periodLength: 5,
    mode: "standard",
    theme: "light",
    weekStart: 1,
    dateFormat: "MMM d, yyyy",
    fertile: false,
    dailyReminder: false,
    periodReminder: false,
    reminderTime: "20:00",
    goals: [],
    onboarded: true,
  };
  const periods = [
    ["2026-07-01", "2026-07-05"],
    ["2026-07-29", "2026-08-02"],
    ["2026-08-26", "2026-08-30"],
    ["2026-09-23", "2026-09-27"],
  ].map(([start, end], i) => ({ id: `history-${i}`, start, end }));
  const log = {
    date: "2026-09-23",
    flow: "medium",
    mood: "Calm",
    symptoms: { Headache: 2 },
    sleep: null,
    energy: null,
    stress: null,
    hydration: null,
    exercise: "",
    appetite: "",
    mucus: "",
    temperature: null,
    note: "Private appointment note",
  };
  await page
    .getByLabel("Import backup file")
    .setInputFiles({
      name: "history.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          version: 1,
          exportedAt: new Date().toISOString(),
          settings,
          periods,
          logs: [log],
          reminders: [],
        }),
      ),
    });
  await page.getByLabel("Restore method").selectOption("replace");
  await page.getByRole("button", { name: "Confirm replacement" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Backup restored." }),
  ).toBeVisible();
  await tab(page, "Insights");
  await expect(
    page.locator(".stat-card").filter({ hasText: "Average cycle" }),
  ).toContainText("28.0");
  await page
    .getByRole("button", { name: "Explore Headache: 1 recorded days" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Headache observations" }),
  ).toContainText("Sep 23, 2026");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("group", { name: "Cycle length over time", exact: true })
    .getByRole("button")
    .first()
    .click();
  await expect(page.locator(".chart-caption").first()).toContainText("28 days");
  let promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  let d = await promise;
  let stream = await d.createReadStream();
  let text = "";
  for await (const chunk of stream!) text += chunk.toString();
  expect(text).toContain("Headache 2/5");
  expect(text).not.toContain("Private appointment note");
  await page.getByLabel("Include notes in report").check();
  promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  d = await promise;
  stream = await d.createReadStream();
  text = "";
  for await (const chunk of stream!) text += chunk.toString();
  expect(text).toContain("Private appointment note");
});
