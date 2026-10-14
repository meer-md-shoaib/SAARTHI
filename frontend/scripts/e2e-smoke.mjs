/**
 * End-to-end smoke test against the running dev stack:
 *   backend  http://127.0.0.1:8000
 *   frontend http://localhost:5173
 *
 * Run:  node scripts/e2e-smoke.mjs
 * Exits non-zero if any step fails or a page error is thrown.
 */

import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.APP_URL || "http://localhost:5173";

const failures = [];
let step = "launch";

function pass(message) {
  console.log(`  PASS  ${message}`);
}

function fail(message) {
  failures.push(`[${step}] ${message}`);
  console.log(`  FAIL  ${message}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--mute-audio"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 940 });

  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.message)));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });

  /* Voice off during the test so speech playback never blocks or distracts. */
  await page.evaluateOnNewDocument(() => {
    window.localStorage.setItem("saarthi:voice", "false");
  });

  const norm = (value) => value.replace(/\s+/g, " ").trim();

  async function hasText(text) {
    return page.evaluate(
      (needle) => document.body.innerText.replace(/\s+/g, " ").includes(needle),
      text,
    );
  }

  async function waitForText(text, timeout = 8000) {
    await page.waitForFunction(
      (needle) => document.body.innerText.replace(/\s+/g, " ").includes(needle),
      { timeout },
      text,
    );
  }

  async function clickText(text, selector = "button", exact = false) {
    const clicked = await page.evaluate(
      (needle, sel, isExact) => {
        const nodes = [...document.querySelectorAll(sel)];
        const target = nodes.find((node) => {
          const value = node.textContent.replace(/\s+/g, " ").trim();
          return isExact ? value === needle : value.includes(needle);
        });
        if (!target) return false;
        target.click();
        return true;
      },
      text,
      selector,
      exact,
    );
    if (!clicked) throw new Error(`element not found: "${text}" (${selector})`);
  }

  /* ---------------------------------------------------------- home */
  step = "home";
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await waitForText("Namaste!");
  pass("home screen renders with greeting");

  const bodyBg = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  if (bodyBg === "rgb(255, 248, 232)") pass("cream theme applied (bg #FFF8E8)");
  else fail(`unexpected body background: ${bodyBg}`);

  if (await hasText("Never share your UPI PIN or OTP.")) pass("safety reminder visible");
  else fail("safety reminder missing");
  if (await hasText("Someone is asking me to pay")) pass("SOS entry point visible");
  else fail("SOS entry point missing");

  /* ------------------------------------------------- scan a demo QR */
  step = "scan-demo";
  await clickText("Scan a QR Code");
  await waitForText("Scan & Check");
  pass("scan screen opens from the home card");

  await clickText("Try a demo");
  await clickText("A normal shop payment");
  await waitForText("Two quick questions");
  pass("demo scenario loads the intent step");

  await clickText("I want to PAY");
  await waitForText("How much do you expect to pay?");
  pass("pay intent reveals the amount field");

  step = "analyze-low";
  await clickText("Check Safety");
  await waitForText("Safety Check Result");
  await waitForText("Low Concern");
  pass("low-concern result reached");

  if (await hasText("No configured warning signs were detected."))
    pass("no-warning-signs message shown");
  else fail("no-warning-signs message missing");
  if (await hasText("not a safety guarantee"))
    pass("anti-guarantee disclaimer present");
  else fail("disclaimer missing");
  if (await hasText("What to do next")) pass("recommended next steps present");
  else fail("next steps missing");
  if (await hasText("rules engine (v1.0.0)")) pass("engine note shown");
  else fail("engine note missing");

  const resultButtonHeight = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) =>
      node.textContent.includes("Listen to Explanation"),
    );
    return button ? button.getBoundingClientRect().height : 0;
  });
  if (resultButtonHeight >= 56) pass(`tap target size ok (${Math.round(resultButtonHeight)}px)`);
  else fail(`Listen button too small: ${resultButtonHeight}px`);

  /* -------------------------------------------- high-concern scenario */
  step = "analyze-high";
  await clickText("Check Another QR");
  await waitForText("Scan & Check");
  await clickText("Type or paste details");
  if (await hasText("Speak details")) pass("voice dictation option visible in manual scan");
  else fail("voice dictation option missing in manual scan");

  await clickText("Try a demo");
  await clickText("A threatening message");
  await waitForText("Two quick questions");
  await clickText("Check Safety");
  await waitForText("High Concern");
  pass("high-concern result reached");
  if (await hasText("Asks for a PIN, OTP or password")) pass("secret-request sign listed");
  else fail("secret-request sign missing");
  if (await hasText("Urgency or threats")) pass("urgency sign listed");
  else fail("urgency sign missing");
  if (await hasText("Open Safety SOS")) pass("SOS shortcut offered on high concern");
  else fail("SOS shortcut missing");

  /* ------------------------------------------------ ask saarthi (typed) */
  step = "ask";
  await clickText("Home", "nav button");
  await waitForText("Namaste!");
  await clickText("Ask Saarthi");
  await waitForText("Ask about payments, QR codes or scams");
  pass("ask screen opens");

  await page.waitForSelector("textarea");
  await page.evaluate(() => {
    const el = document.querySelector("textarea");
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.focus();
    }
  });
  await new Promise((r) => setTimeout(r, 250));
  await page.type("textarea", "Should I share my OTP?", { delay: 10 });
  await page.waitForFunction(
    () => [...document.querySelectorAll("textarea")].some((a) => a.value.includes("OTP")),
    { timeout: 4000 },
  );
  await clickText("Ask", "button", true);
  await waitForText("Saarthi says");
  await waitForText("Never share it");
  pass("typed question answered from the knowledge base");

  /* ------------------------------------------------ quiz */
  step = "quiz";
  await clickText("Home", "nav button");
  await waitForText("Namaste!");
  await clickText("Learn Safely");
  await waitForText("Learn Safely");
  await clickText("Scam or Safe?");
  await waitForText("Question 1 of 6");
  pass("quiz opens with progress");
  await clickText("It is a scam", "button", true);
  await waitForText("That's right!");
  if (await hasText("What to do")) pass("quiz explains and advises after answering");
  else fail("quiz explanation missing");

  /* ------------------------------------------------ safety SOS */
  step = "sos";
  await clickText("Home", "nav button");
  await waitForText("Namaste!");
  await clickText("Someone is asking me to pay");
  await waitForText("Safety SOS");

  if (await hasText("Immediate Family Emergency Contacts"))
    pass("4 family emergency contacts shown");
  else fail("emergency contacts header missing");

  if ((await hasText("Rahul")) && (await hasText("Savitri")) && (await hasText("Aarav")) && (await hasText("Ananya")))
    pass("son, wife, grandson, granddaughter contacts present");
  else fail("family member names missing");

  if ((await hasText("1930")) && (await hasText("cybercrime.gov.in")))
    pass("cybercrime.gov.in portal and 1930 helpline present");
  else fail("cybercrime portal link or helpline missing");

  await clickText("Send SOS Alert", "button", true);
  if (await hasText("Alert dispatched to Rahul"))
    pass("emergency alert dispatch confirmation displayed");
  else fail("emergency alert feedback missing");

  await clickText("They are asking for my PIN or OTP.");
  await waitForText("Do this now");
  if (await hasText("not an emergency service")) pass("SOS shows its guidance disclaimer");
  else fail("SOS disclaimer missing");

  /* ------------------------------------------------ story */
  step = "story";
  await clickText("Home", "nav button");
  await waitForText("Namaste!");
  await clickText("Learn Safely");
  await waitForText("Learn Safely");
  await clickText("Safer Choices");
  await waitForText("Meena gets a message");
  await new Promise((r) => setTimeout(r, 300));
  await clickText("Pause and think first", "button", true);
  await waitForText("Check the QR in the app");
  await new Promise((r) => setTimeout(r, 200));
  await clickText("Check the QR in the app", "button", true);
  await waitForText("Do not pay, tell her son");
  await new Promise((r) => setTimeout(r, 200));
  await clickText("Do not pay, tell her son", "button", true);
  await waitForText("A safe choice");
  pass("story reaches the safe ending");
  await new Promise((r) => setTimeout(r, 400));

  /* ------------------------------------------------ language switch */
  step = "language";
  await clickText("Home", "nav button");
  await waitForText("Namaste!");
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => document.querySelector('[data-testid="language-button"]')?.click());
  await waitForText("हिन्दी");
  await new Promise((r) => setTimeout(r, 150));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll(".z-50 button")];
    btns.find((b) => b.textContent.includes("हिन्दी"))?.click();
  });
  await waitForText("नमस्ते");
  pass("Hindi language switch works");

  await page.evaluate(() => document.querySelector('[data-testid="language-button"]')?.click());
  await waitForText("ಕನ್ನಡ");
  await new Promise((r) => setTimeout(r, 150));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll(".z-50 button")];
    btns.find((b) => b.textContent.includes("ಕನ್ನಡ"))?.click();
  });
  await waitForText("ನಮಸ್ಕಾರ");
  pass("Kannada language switch works");

  await page.evaluate(() => document.querySelector('[data-testid="language-button"]')?.click());
  await waitForText("English");
  await new Promise((r) => setTimeout(r, 150));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll(".z-50 button")];
    btns.find((b) => b.textContent.includes("English"))?.click();
  });
  await waitForText("Namaste!");
  pass("English switch back works");
  await new Promise((r) => setTimeout(r, 200));

  /* ------------------------------------------------ text size */
  step = "text-size";
  await new Promise((r) => setTimeout(r, 300));
  const before = await page.evaluate(() => document.documentElement.style.fontSize);
  await page.evaluate(() => document.querySelector('[data-testid="text-size-button"]')?.click());
  await new Promise((r) => setTimeout(r, 100));
  const after = await page.evaluate(() => document.documentElement.style.fontSize);
  if (before !== after && after === "112%") pass(`text size control works (${before} -> ${after})`);
  else fail(`text size did not change: ${before} -> ${after}`);

  /* ------------------------------------------------ voice toggle */
  step = "voice-toggle";
  await page.evaluate(() => document.querySelector('[data-testid="voice-toggle"]')?.click());
  await new Promise((r) => setTimeout(r, 100));
  const voiceOff = await page.evaluate(() => {
    const button = document.querySelector('[data-testid="voice-toggle"]');
    return Boolean(button) && button.getAttribute("aria-label") === "Voice guidance on";
  });
  if (voiceOff) pass("voice assistance toggle flips state");
  else fail("voice toggle did not flip");

  /* ------------------------------------------------ backend unreachable states are explicit */
  step = "errors";
  const health = await page.evaluate(async () => {
    const response = await fetch("/api/v1/analyze-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_text: "", intention: "pay" }),
    });
    return response.status;
  });
  if (health === 422) pass("backend validation returns 422 (no silent fake result)");
  else fail(`expected 422 for empty input, got ${health}`);

  const realErrors = pageErrors.filter(
    (text) =>
      !text.includes("favicon") &&
      !text.includes("net::ERR_ABORTED") &&
      !text.includes("status of 422"),
  );
  if (realErrors.length === 0) pass("no page/console errors during the whole run");
  else fail(`page errors: ${realErrors.slice(0, 3).join(" | ")}`);
} catch (error) {
  fail(String(error && error.message ? error.message : error));
} finally {
  await browser.close();
}

console.log("\n----------------------------------------");
if (failures.length === 0) {
  console.log("SMOKE TEST PASSED");
  process.exit(0);
} else {
  console.log(`SMOKE TEST FAILED (${failures.length})`);
  for (const failure of failures) console.log(` - ${failure}`);
  process.exit(1);
}
