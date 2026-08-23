// ==================== CONFIG ====================
const API_KEY = "0a202282d915d3289d5132ceec0f758a"; // ImgBB API Key
const ADMIN_PHONE = "6285165721384"; // Nomor WA admin

// ==================== ELEMENT SELECTORS ====================
const triggerBtn = document.getElementById("triggerBtn");
const fileInput = document.getElementById("fileInput");
const previewModal = document.getElementById("previewModal");
const modalPreview = document.getElementById("modalPreview");
const cancelBtn = document.getElementById("cancelBtn");
const confirmUploadBtn = document.getElementById("confirmUploadBtn");
const loadingEl = document.getElementById("loading");
const resultSection = document.getElementById("resultSection");
const uploadedImg = document.getElementById("uploadedImg");
const resultLink = document.getElementById("resultLink");
const sendBtn = document.getElementById("sendBtn");
const senderNameInput = document.getElementById("senderName");
const userDescInput = document.getElementById("userDesc");
const genderInputs = document.querySelectorAll('input[name="gender"]');
const codePreview = document.getElementById("codePreview");

// ==================== STATE ====================
let selectedFile = null;
let uploadedUrl = "";

// ==================== EVENT LISTENERS ====================

// Trigger file input
triggerBtn.addEventListener("click", () => {
  fileInput.click();
});

// Handle file selection
fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type — check MIME type, fallback to extension
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const fileName = file.name || "";
  const fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  const isValidMime = allowedTypes.includes(file.type);
  const isValidExt = allowedExts.includes(fileExt);
  if (!isValidMime && !isValidExt) {
    alert("Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
    fileInput.value = "";
    return;
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("Ukuran file terlalu besar. Maksimal 10MB.");
    fileInput.value = "";
    return;
  }

  selectedFile = file;

  // Preview in modal
  const reader = new FileReader();
  reader.onload = (ev) => {
    modalPreview.src = ev.target.result;
    previewModal.classList.add("active");
  };
  reader.readAsDataURL(selectedFile);
});

// Confirm upload to ImgBB
confirmUploadBtn.addEventListener("click", () => {
  if (!selectedFile) return;

  previewModal.classList.remove("active");
  loadingEl.style.display = "block";

  const formData = new FormData();
  formData.append("image", selectedFile);
  formData.append("key", API_KEY);

  fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData })
    .then(res => res.json())
    .then(handleUploadResult)
    .catch(handleUploadError);
});

// Cancel preview
cancelBtn.addEventListener("click", () => {
  previewModal.classList.remove("active");
  selectedFile = null;
});

// ==================== UPLOAD HANDLERS ====================

function handleUploadResult(data) {
  loadingEl.style.display = "none";
  if (data.success) {
    uploadedUrl = data.data.url;
    uploadedImg.src = uploadedUrl;
    resultLink.href = uploadedUrl;
    resultLink.textContent = uploadedUrl;
    resultSection.style.display = "block";
    updateCodePreview();
  } else {
    alert("Gagal: " + (data.error?.message || "Error tidak diketahui"));
  }
}

function handleUploadError(err) {
  loadingEl.style.display = "none";
  alert("Error jaringan: " + err.message);
}

// ==================== CODE PREVIEW ====================

function updateCodePreview() {
  const genderSelected = document.querySelector('input[name="gender"]:checked');
  const gender = genderSelected ? genderSelected.value : "...";
  const now = new Date();
  const date = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");

  const jsonData = {
    name: "",
    gender: gender,
    url: uploadedUrl || "https://...",
    date: date
  };

  codePreview.textContent = JSON.stringify(jsonData, null, 2);
}

// ==================== SEND BUTTON STATE ====================

function updateSendButton() {
  const senderName = senderNameInput.value.trim();
  const genderSelected = Array.from(genderInputs).some(radio => radio.checked);
  sendBtn.className = (senderName && genderSelected)
    ? "send-btn enabled"
    : "send-btn disabled";
}

senderNameInput.addEventListener("input", updateSendButton);
userDescInput.addEventListener("input", updateCodePreview);

genderInputs.forEach((radio) => {
  radio.addEventListener("change", () => {
    updateSendButton();
    updateCodePreview();
  });
});

// ==================== SEND TO WHATSAPP ====================

sendBtn.addEventListener("click", () => {
  if (!sendBtn.classList.contains("enabled")) return;

  const senderName = senderNameInput.value.trim();
  const userDesc = userDescInput.value.trim() || "-";
  const gender = document.querySelector('input[name="gender"]:checked').value;

  const now = new Date();
  const date = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");

  const jsonData = {
    name: "",
    gender: gender,
    url: uploadedUrl,
    date: date
  };

  const jsonStr = JSON.stringify(jsonData, null, 2);
  const message =
    "```json\n" + jsonStr + "\n```\n\n" +
    "Nama pengirim: " + senderName + "\n" +
    "Deskripsi: " + userDesc;

  const encoded = encodeURIComponent(message);
  const waUrl = "https://wa.me/" + ADMIN_PHONE + "?text=" + encoded;

  // Kirim ke Flutter via JavaScriptChannel untuk dibuka secara eksternal
  if (window.FlutterUploadHandler) {
    window.FlutterUploadHandler.postMessage(waUrl);
  } else {
    // Fallback: buka langsung (mungkin tidak bekerja di WebView)
    window.location.href = waUrl;
  }
});

// ==================== CLOSE WEBVIEW ====================

function goBackHome() {
  if (window.AndroidUpload) {
    window.AndroidUpload.closeWebView();
  }
}
