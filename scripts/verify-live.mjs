import { chromium, webkit } from "playwright";

const url = process.env.LIVE_URL;
const browserName = process.env.LIVE_BROWSER ?? "chromium";

if (!url) {
  throw new Error("LIVE_URL is required.");
}

const browserType = browserName === "webkit" ? webkit : chromium;
const browser = await browserType.launch(
  browserName === "chromium" && process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : undefined,
);
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const errors = [];

page.on("pageerror", (error) => errors.push(`Page error: ${error.message}`));
page.on("requestfailed", (request) => {
  if (["document", "script", "stylesheet"].includes(request.resourceType())) {
    errors.push(
      `Failed ${request.resourceType()}: ${request.url()} (${request.failure()?.errorText ?? "unknown error"})`,
    );
  }
});

try {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });

  if (!response?.ok()) {
    throw new Error(`GitHub Pages returned HTTP ${response?.status() ?? "unknown"}.`);
  }

  await page
    .getByRole("heading", { name: "A little closer to yourself." })
    .waitFor({ timeout: 20_000 });

  const workerScope = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return "unsupported";
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Service worker timed out.")), 15_000),
      ),
    ]);
    return registration.scope;
  });

  if (!workerScope.endsWith("/P_WPA/")) {
    throw new Error(`Unexpected service worker scope: ${workerScope}`);
  }

  if (errors.length) {
    throw new Error(errors.join("\n"));
  }

  console.log(`Verified ${url} in ${browserName}; service worker: ${workerScope}`);
} finally {
  await browser.close();
}
