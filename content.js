console.log("content.js loaded");

// html2canvas and jsQR are loaded via manifest and ready to use

let selectionDiv = null;
let overlay = null;
let startX, startY;

function startSelection() {
  // Create overlay for area selection
  overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 2147483647,
    cursor: "crosshair",
  });
  document.body.appendChild(overlay);

  // Create selection box
  selectionDiv = document.createElement("div");
  Object.assign(selectionDiv.style, {
    position: "fixed",
    border: "2px dashed #4CAF50",
    backgroundColor: "transparent",
    zIndex: 2147483648,
    pointerEvents: "none",
  });
  document.body.appendChild(selectionDiv);

  overlay.addEventListener("mousedown", onMouseDown);
}

function onMouseDown(e) {
  startX = e.clientX;
  startY = e.clientY;

  selectionDiv.style.left = `${startX}px`;
  selectionDiv.style.top = `${startY}px`;
  selectionDiv.style.width = `0px`;
  selectionDiv.style.height = `0px`;

  overlay.addEventListener("mousemove", onMouseMove);
  overlay.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e) {
  const currentX = e.clientX;
  const currentY = e.clientY;

  const left = Math.min(currentX, startX);
  const top = Math.min(currentY, startY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  selectionDiv.style.left = `${left}px`;
  selectionDiv.style.top = `${top}px`;
  selectionDiv.style.width = `${width}px`;
  selectionDiv.style.height = `${height}px`;
}

async function onMouseUp() {
  // Remove event listeners
  overlay.removeEventListener("mousemove", onMouseMove);
  overlay.removeEventListener("mouseup", onMouseUp);
  overlay.removeEventListener("mousedown", onMouseDown);

  const rect = selectionDiv.getBoundingClientRect();

  // Hide overlay to avoid capture interference
  overlay.style.display = "none";

  // Capture full page screenshot
  const canvas = await html2canvas(document.documentElement);

  // Restore overlay display (optional)
  overlay.style.display = "block";

  const pageWidth = document.documentElement.scrollWidth;
  const pageHeight = document.documentElement.scrollHeight;

  const scaleX = canvas.width / pageWidth;
  const scaleY = canvas.height / pageHeight;

  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  const sx = (rect.left + scrollX) * scaleX;
  const sy = (rect.top + scrollY) * scaleY;
  const sWidth = rect.width * scaleX;
  const sHeight = rect.height * scaleY;

  // Create cropped canvas from selection area
  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = sWidth;
  croppedCanvas.height = sHeight;
  const ctx = croppedCanvas.getContext("2d");
  ctx.drawImage(canvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

  const dataUrl = croppedCanvas.toDataURL("image/png");

  // Clean up selection elements
  selectionDiv.remove();
  overlay.remove();

  recognizeQRCodeFromDataUrl(dataUrl);
}

function recognizeQRCodeFromDataUrl(dataUrl) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code && code.data) {
      showFloatingResult(code.data);
    } else {
      showFloatingResult("No QR code detected");
    }
  };
  img.src = dataUrl;
}

function showFloatingResult(text) {
  // Remove old result container if exists
  let old = document.getElementById("qrFloatingResult");
  if (old) old.remove();

  const container = document.createElement("div");
  container.id = "qrFloatingResult";
  Object.assign(container.style, {
    position: "fixed",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#222",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "5px",
    fontSize: "16px",
    zIndex: 2147483649,
    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    maxWidth: "90vw",
    cursor: "default",
  });

  const textSpan = document.createElement("span");
  textSpan.textContent = text;

  const copyBtn = document.createElement("button");
  copyBtn.id = "copyBtn";  // for CSS styling
  copyBtn.textContent = "Copy";
  copyBtn.style.userSelect = "none";

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = "Copied";
      copyBtn.disabled = true;
      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.disabled = false;
      }, 1500);
    });
  };

  container.appendChild(textSpan);

  if (/^https?:\/\//i.test(text)) {
    const link = document.createElement("a");
    link.href = text;
    link.textContent = "Open Link";
    link.target = "_blank";
    link.style.color = "#4CAF50";
    link.style.textDecoration = "underline";
    container.appendChild(link);
  }

  container.appendChild(copyBtn);

  document.body.appendChild(container);

  setTimeout(() => {
    container.remove();
  }, 5000);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "startSelection") {
    startSelection();
  }
});
