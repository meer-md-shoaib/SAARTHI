import puppeteer from "puppeteer-core";
import { QRCodeWriter, BarcodeFormat } from "@zxing/library";

const writer = new QRCodeWriter();
const matrix = writer.encode("upi://pay?pa=rahul.sharma@okhdfcbank&pn=Rahul&am=500", BarcodeFormat.QR_CODE, 300, 300, new Map());
const w = matrix.getWidth();
const h = matrix.getHeight();
const qrPixels = [];
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    qrPixels.push(matrix.get(x, y) ? 0 : 255);
  }
}

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--mute-audio",
  ],
});

try {
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.text()));
  page.on("pageerror", (err) => console.error("BROWSER PAGEERROR:", err));

  await page.goto("http://localhost:5173", { waitUntil: "networkidle0" });

  // Navigate to Scan
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("button, a, [role='button']"));
    const target = nodes.find((n) => n.textContent && n.textContent.includes("Scan a QR Code"));
    target?.click();
  });

  await new Promise((r) => setTimeout(r, 1000));

  // Now, in the page, create data URL of the QR code
  const result = await page.evaluate(async ({ qrPixels, w, h }) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "NO_CTX";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 640, 480);

    const qrCanvas = document.createElement("canvas");
    qrCanvas.width = w;
    qrCanvas.height = h;
    const qrCtx = qrCanvas.getContext("2d");
    const imgData = qrCtx.createImageData(w, h);
    for (let i = 0; i < qrPixels.length; i++) {
      const v = qrPixels[i];
      imgData.data[i * 4] = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }
    qrCtx.putImageData(imgData, 0, 0);

    ctx.drawImage(qrCanvas, 195, 115, 250, 250);
    const dataUrl = canvas.toDataURL("image/png");

    // Convert dataUrl to blob and simulate file upload
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "test-qr.png", { type: "image/png" });

    // Find the file input on the upload tab
    const uploadTab = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Upload") || b.innerText.includes("अपलोड"));
    uploadTab?.click();

    await new Promise(r => setTimeout(r, 500));

    const input = document.querySelector('input[type="file"]');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    await new Promise(r => setTimeout(r, 1500));

    return {
      bodyText: document.body.innerText.slice(0, 500),
      detectedStep: document.body.innerText.includes("Two quick questions") || document.body.innerText.includes("दो त्वरित प्रश्न") || document.body.innerText.includes("Paying To") || document.body.innerText.includes("प्राप्तकर्ता")
    };
  }, { qrPixels, w, h });

  console.log("Upload decode result:", JSON.stringify(result));

  await browser.close();
} catch (e) {
  console.error("Error:", e);
  await browser.close();
}
