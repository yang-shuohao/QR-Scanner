const upload = document.getElementById("upload");
const resultText = document.getElementById("resultText");
const resultBox = document.getElementById("resultBox");
const copyBtn = document.getElementById("copyBtn");
const linkBtn = document.getElementById("linkBtn");

function decodeQRCodeFromImage(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code ? code.data : null;
}

upload.addEventListener("change", () => {
  if (upload.files.length === 0) return;
  const file = upload.files[0];
  const img = new Image();
  img.onload = () => {
    const data = decodeQRCodeFromImage(img);
    if (data) {
      displayResult(data);
    } else {
      displayResult("No QR code detected");
    }
  };
  img.onerror = () => {
    displayResult("Failed to load image");
  };
  img.src = URL.createObjectURL(file);
});

function displayResult(text) {
  resultText.textContent = text;

  if (/^https?:\/\//i.test(text)) {
    linkBtn.style.display = "inline-block";
    linkBtn.href = text;
  } else {
    linkBtn.style.display = "none";
    linkBtn.href = "#";
  }

  resultBox.style.display = "block";
}

copyBtn.onclick = () => {
  const text = resultText.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied";
    copyBtn.disabled = true;
    setTimeout(() => {
      copyBtn.textContent = "Copy";
      copyBtn.disabled = false;
    }, 1500);
  });
};
