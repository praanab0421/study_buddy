const pdfInput = document.querySelector("#pdfInput");
const dropzone = document.querySelector("#dropzone");
const fileRow = document.querySelector("#fileRow");
const fileName = document.querySelector("#fileName");
const statusEl = document.querySelector("#status");
const resultContent = document.querySelector("#resultContent");
const copyBtn = document.querySelector("#copyBtn");
let selectedFile = null;
let extractedText = "";
let lastAnswer = "";
let stats = { notes: 0, tools: 0, sessions: 0 };

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#c2413b" : "";
}

async function readPdf(file) {
  if (!file || file.type !== "application/pdf") throw new Error("Please select a PDF file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Please choose a PDF smaller than 10 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  let text = "";
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(" ") + "\n";
  }
  if (text.trim().length < 30) {
    throw new Error("I couldn't extract readable text. This may be a scanned PDF; try a text-based PDF.");
  }
  return text;
}

async function chooseFile(file) {
  try {
    selectedFile = file;
    extractedText = "";
    fileName.textContent = file.name;
    fileRow.hidden = false;
    setStatus("Reading your PDF...");
    extractedText = await readPdf(file);
    setStatus(`Ready! Extracted text from ${file.name}. Choose a study tool.`);
  } catch (error) {
    selectedFile = null;
    extractedText = "";
    fileRow.hidden = true;
    setStatus(error.message, true);
  }
}

pdfInput.addEventListener("change", event => {
  if (event.target.files[0]) chooseFile(event.target.files[0]);
});
document.querySelector("#removeFile").addEventListener("click", () => {
  selectedFile = null; extractedText = ""; pdfInput.value = ""; fileRow.hidden = true;
  setStatus("Choose a PDF before selecting a study tool.");
});
["dragenter", "dragover"].forEach(name => dropzone.addEventListener(name, e => {
  e.preventDefault(); dropzone.classList.add("dragging");
}));
["dragleave", "drop"].forEach(name => dropzone.addEventListener(name, e => {
  e.preventDefault(); dropzone.classList.remove("dragging");
}));
dropzone.addEventListener("drop", e => {
  const file = e.dataTransfer.files[0];
  if (file) chooseFile(file);
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
function renderText(text) {
  // Render plain text safely; keep line breaks and basic headings readable.
  return text.split("\n").map(line => {
    const safe = escapeHtml(line.trim());
    if (!safe) return "";
    if (/^#{1,3}\s/.test(line)) return `<h3>${safe.replace(/^#{1,3}\s*/, "")}</h3>`;
    if (/^[-*•]\s/.test(line)) return `<p>• ${safe.replace(/^[-*•]\s*/, "")}</p>`;
    return `<p>${safe}</p>`;
  }).join("");
}

const taskNames = { summary: "Summary", explain: "Explanation", mcq: "MCQs", quiz: "Quiz" };
async function runTask(task, button) {
  if (!selectedFile || !extractedText) {
    setStatus("Upload a readable PDF first.", true);
    document.querySelector("#upload").scrollIntoView({ behavior: "smooth" });
    return;
  }
  document.querySelectorAll(".tool-card").forEach(btn => btn.disabled = true);
  resultContent.innerHTML = `<div class="loading"><span class="spinner"></span> Study Buddy is preparing your ${taskNames[task].toLowerCase()}...</div>`;
  setStatus("Sending extracted text securely to the Study Buddy server...");
  resultContent.scrollIntoView({ behavior: "smooth", block: "nearest" });
  try {
    const response = await fetch("/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: extractedText, task })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    lastAnswer = data.answer;
    resultContent.innerHTML = renderText(data.answer);
    copyBtn.disabled = false;
    stats.tools++;
    stats.sessions++;
    if (task === "summary") stats.notes++;
    updateStats();
    addActivity(`${taskNames[task]} generated for ${selectedFile.name}`);
    setStatus(`${taskNames[task]} generated successfully.`);
  } catch (error) {
    resultContent.innerHTML = `<p style="color:#b42318">${escapeHtml(error.message)}</p>`;
    setStatus(error.message, true);
  } finally {
    document.querySelectorAll(".tool-card").forEach(btn => btn.disabled = false);
  }
}
document.querySelectorAll(".tool-card").forEach(button => {
  button.addEventListener("click", () => runTask(button.dataset.task, button));
});
copyBtn.addEventListener("click", async () => {
  if (!lastAnswer) return;
  await navigator.clipboard.writeText(lastAnswer);
  copyBtn.textContent = "Copied!";
  setTimeout(() => copyBtn.textContent = "Copy text", 1500);
});
function updateStats() {
  document.querySelector("#notesCount").textContent = stats.notes;
  document.querySelector("#quizCount").textContent = stats.tools;
  document.querySelector("#sessionCount").textContent = stats.sessions;
  const percent = Math.min(100, stats.tools * 15);
  document.querySelector("#progressPercent").textContent = `${percent}%`;
  document.querySelector(".progress-ring").style.background =
    `conic-gradient(#1765ed ${percent * 3.6}deg,#dce6ff 0deg)`;
}
function addActivity(message) {
  const list = document.querySelector("#activityList");
  if (list.querySelector(".muted")) list.innerHTML = "";
  const item = document.createElement("div");
  item.innerHTML = `<span class="activity-dot">✓</span><span>${escapeHtml(message)}</span>`;
  list.prepend(item);
}
