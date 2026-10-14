import puppeteer from "puppeteer-core";
import { QRCodeWriter, BarcodeFormat } from "@zxing/library";

const writer = new QRCodeWriter();
const matrix = writer.encode("upi://pay?pa=green.kiran@okhdfcbank&pn=Green%20Kiran&am=250", BarcodeFormat.QR_CODE, 300, 300, new Map());
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
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.error("PAGE ERROR:", err));

  await page.goto("http://localhost:5173", { waitUntil: "networkidle0" });

  // Navigate to Scan
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("button, a, [role='button']"));
    const target = nodes.find((n) => n.textContent && n.textContent.includes("Scan a QR Code"));
    target?.click();
  });

  await new Promise((r) => setTimeout(r, 1000));

  // Click Start Camera
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const startBtn = btns.find((b) => b.textContent && b.textContent.includes("Start Camera"));
    startBtn?.click();
  });

  await new Promise((r) => setTimeout(r, 1000));

  // Replace video stream with canvas.captureStream drawing our QR code!
  const streamResult = await page.evaluate(async ({ qrPixels, w, h }) => {
    const video = document.querySelector("video");
    if (!video) return "NO_VIDEO";

    const qrCanvas = document.createElement("canvas");
    qrCanvas.width = 640;
    qrCanvas.height = 480;
    const ctx = qrCanvas.getContext("2d");
    if (!ctx) return "NO_CTX";

    const imgCanvas = document.createElement("canvas");
    imgCanvas.width = w;
    imgCanvas.height = h;
    const imgCtx = imgCanvas.getContext("2d");
    const imgData = imgCtx.createImageData(w, h);
    for (let i = 0; i < qrPixels.length; i++) {
      const v = qrPixels[i];
      imgData.data[i * 4] = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }
    imgCtx.putImageData(imgData, 0, 0);

    // Continuous draw on qrCanvas
    function draw() {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 640, 480);
      ctx.drawImage(imgCanvas, 170, 90, 300, 300);
      requestAnimationFrame(draw);
    }
    draw();

    const mockStream = qrCanvas.captureStream(30);
    // Replace stream on video
    video.srcObject = mockStream;
    await video.play();

    return "STREAM_REPLACED";
  }, { qrPixels, w, h });

  console.log("Mock stream setup:", streamResult);

  // Wait 3 seconds and check if detected
  await new Promise((r) => setTimeout(r, 3000));

  const textAfter = await page.evaluate(() => document.body.innerText.slice(0, 400));
  console.log("PAGE TEXT AFTER 3s:\n", textAfter);

  await browser.close();
} catch (e) {
  console.error("Error:", e);
  await browser.close();
}
