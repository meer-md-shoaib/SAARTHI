/**
 * Automated end-to-end test suite for newly fixed features:
 * 1. Option 2: Manual UPI Link & Standalone VPA decoding with live preview and visual explanation
 * 2. Option 3: Image / Screenshot QR decoding and processing
 * 3. Multilingual Visual Explanation card (Money direction, Recipient, Bank, Amount)
 * 4. Family Profiles system (View, Add, Verify match)
 */

import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.APP_URL || "http://localhost:5173";

const failures = [];
let step = "init";

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

  page.on("pageerror", (err) => console.error("Page error:", err.message));

  await page.evaluateOnNewDocument(() => {
    window.localStorage.setItem("saarthi:voice", "false");
  });

  async function hasText(text) {
    return page.evaluate(
      (needle) => document.body.innerText.toLowerCase().replace(/\s+/g, " ").includes(needle.toLowerCase()),
      text,
    );
  }

  async function waitForText(text, timeout = 8000) {
    try {
      await page.waitForFunction(
        (needle) => document.body.innerText.toLowerCase().replace(/\s+/g, " ").includes(needle.toLowerCase()),
        { timeout },
        text,
      );
    } catch (e) {
      const pageText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
      const taVal = await page.evaluate(() => document.querySelector("textarea")?.value);
      console.log(`[TIMEOUT waiting for "${text}"] Textarea value: "${taVal}", Full page: "${pageText}"`);
      throw e;
    }
  }

  async function clickText(text, selector = "button", exact = false) {
    await page.waitForFunction(
      (needle, sel, isExact) => {
        const nodes = [...document.querySelectorAll(sel)];
        return nodes.some((node) => {
          const value = node.textContent.replace(/\s+/g, " ").trim();
          return isExact ? value === needle : value.includes(needle);
        });
      },
      { timeout: 8000 },
      text,
      selector,
      exact,
    );
    await new Promise((r) => setTimeout(r, 400));
    const clicked = await page.evaluate(
      (needle, sel, isExact) => {
        const nodes = [...document.querySelectorAll(sel)];
        const target = nodes.find((node) => {
          const value = node.textContent.replace(/\s+/g, " ").trim();
          return isExact ? value === needle : value.includes(needle);
        });
        if (!target) return false;
        target.scrollIntoView({ block: "center" });
        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        target.click();
        return true;
      },
      text,
      selector,
      exact,
    );
    if (!clicked) {
      const allButtons = await page.evaluate(() => [...document.querySelectorAll("button")].map(b => b.textContent.trim()));
      console.log("Available buttons:", allButtons);
      throw new Error(`element not found: "${text}" (${selector})`);
    }
  }

  async function clickSelector(selector) {
    await page.waitForSelector(selector);
    await new Promise((r) => setTimeout(r, 400));
    const ok = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      el.click();
      return true;
    }, selector);
    if (!ok) throw new Error(`Selector not found: ${selector}`);
  }

  async function typeInto(selector, text) {
    await page.waitForSelector(selector);
    await page.evaluate((sel, val) => {
      const el = document.querySelector(sel);
      if (el) {
        el.scrollIntoView({ block: "center" });
        el.focus();
        const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        setter?.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, selector, text);
    await new Promise((r) => setTimeout(r, 300));
  }

  // -------------------------------------------------- 1. Family Profiles
  step = "family-profiles";
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await waitForText("Namaste!");
  pass("home screen loaded");

  await clickText("Family Profiles");
  await waitForText("Family & Trusted Contacts");
  pass("Family Profiles screen opened");

  if (await hasText("Rahul Sharma") && await hasText("rahul.sharma@okhdfcbank")) {
    pass("Default family member Rahul Sharma (Son) visible");
  } else {
    fail("Default family member missing");
  }

  // Add a new family contact
  await new Promise((r) => setTimeout(r, 400));
  await page.waitForSelector("[data-testid='add-family-btn']");
  await page.click("[data-testid='add-family-btn']");

  await page.waitForSelector("input[placeholder='e.g. rahul@okhdfcbank']");
  await page.type("input[placeholder='e.g. Rahul Sharma']", "Uncle Anand");
  await page.type("input[placeholder='e.g. rahul@okhdfcbank']", "anand@okaxis");
  await page.click("[data-testid='save-family-btn']");
  await waitForText("Uncle Anand");
  pass("Newly added family contact saved and displayed");

  // -------------------------------------------------- 2. Option 2: Manual UPI Input with Live Preview
  step = "manual-upi";
  console.log("Navigating back to Home...");
  await page.click("[data-testid='nav-home']");
  await waitForText("Namaste!");
  pass("Returned to home screen");

  console.log("Opening Scan a QR Code...");
  await clickText("Scan a QR Code");
  await waitForText("Scan & Check");
  pass("Scan screen opened");

  console.log("Selecting Manual input tab...");
  await clickSelector("[data-testid='method-tab-manual']");
  await waitForText("Quick samples (tap to test):");
  pass("Manual input option opened with quick sample chips");

  // Type a standalone VPA
  console.log("Typing standalone VPA...");
  await typeInto("textarea", "rahul.sharma@okhdfcbank");
  await waitForText("Decoded Payment Information");
  if (await hasText("HDFC Bank") && await hasText("Verified Family Member: Rahul Sharma")) {
    pass("Live decoding identified recipient, HDFC Bank, and family profile match");
  } else {
    fail("Live decoding did not show expected recipient and family match");
  }

  await clickText("Continue");
  await waitForText("Two quick questions");
  pass("Transitioned to Visual Explanation confirmation step");

  // Check Visual Payment Explanation Card
  if (await hasText("Money is LEAVING your account") && await hasText("Outgoing") && await hasText("Your Bank")) {
    pass("Multilingual visual money direction flow diagram displayed");
  } else {
    fail("Visual money direction flow diagram missing");
  }

  // Complete analysis
  await clickText("Check Safety");
  await waitForText("Safety Check Result");
  pass("Result screen reached");

  if (await hasText("Verified Family / Trusted Contact: Rahul Sharma (Son)")) {
    pass("Result screen displays verified family badge on visual card");
  } else {
    fail("Verified family badge missing on result screen");
  }

  // -------------------------------------------------- 3. Option 3: QR Image / Screenshot Upload & Demo
  step = "upload-and-demo";
  await clickText("Check Another QR");
  await waitForText("Scan & Check");

  console.log("Selecting Upload/Demo tab...");
  await clickSelector("[data-testid='method-tab-upload']");
  await waitForText("Choose a QR Screenshot or Photo");
  pass("Option 3: Upload QR Photo / Screenshot panel opened");

  if (await hasText("Tap to select an image, or drag and drop") && await hasText("Supports JPG, PNG, WEBP")) {
    pass("File upload drop area and supported formats displayed");
  } else {
    fail("Upload area missing");
  }

  if (await hasText("A normal shop payment") && await hasText("Kirana shop QR: right name, right amount.")) {
    pass("Demo scenarios available alongside image upload");
  } else {
    fail("Demo scenarios missing in Option 3");
  }

  // -------------------------------------------------- 4. Multilingual Visual Explanation in Hindi
  step = "hindi-visual-explanation";
  // Switch to Hindi
  await clickSelector("[data-testid='nav-home']");
  await waitForText("Namaste!");
  await page.click('[data-testid="language-button"]');
  await waitForText("हिन्दी");
  await clickText("हिन्दी");
  await waitForText("नमस्ते");
  pass("Switched language to Hindi");

  await clickText("क्यूआर स्कैन करें");
  await waitForText("स्कैन करें और जाँचें");

  console.log("Selecting Manual input tab in Hindi...");
  await clickSelector("[data-testid='method-tab-manual']");
  await typeInto("textarea", "upi://pay?pa=green.kiran@okhdfcbank&pn=Green%20Kiran%20Stores&am=250&cu=INR");
  await clickText("आगे बढ़ें");
  await waitForText("दो छोटे सवाल");
  pass("Entered Hindi payment flow");

  if (await hasText("पैसे आपके बैंक खाते से कटेंगे") && await hasText("भुगतान") && await hasText("आपका खाता")) {
    pass("Hindi visual money direction and transfer diagram verified");
  } else {
    fail("Hindi visual money flow diagram missing");
  }

  await clickText("सुरक्षा जाँचें");
  await waitForText("सुरक्षा जाँच का परिणाम");
  pass("Hindi safety result screen reached");

  if (await hasText("पैसे आपके बैंक खाते से कटेंगे") && await hasText("Green Kiran Stores")) {
    pass("Hindi result screen renders visual payment explanation");
  } else {
    fail("Hindi result screen visual payment explanation missing");
  }

} catch (err) {
  fail(String(err && err.message ? err.message : err));
} finally {
  await browser.close();
}

console.log("\n----------------------------------------");
if (failures.length === 0) {
  console.log("ALL FEATURE TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.log(`FEATURE TESTS FAILED (${failures.length}):`);
  for (const f of failures) console.log(` - ${f}`);
  process.exit(1);
}
