const API_URL = "https://nova-ai-api.chatterjeesagnik24032011.workers.dev/api/chat";
const form = document.querySelector("#chat-form");
const input = document.querySelector("#prompt-input");
const statusNote = document.querySelector("#status-note");
const thread = document.querySelector("#chat-thread");
const promptGrid = document.querySelector(".prompt-grid");
const welcomeTitle = document.querySelector("#welcome-title");
const introCopy = document.querySelector("#intro-copy");
const messages = [];
let sending = false;

function addMessage(role, content, extraClass = "") {
  const article = document.createElement("article");
  article.className = `message ${role} ${extraClass}`.trim();
  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : "nova.ai";
  const text = document.createElement("div");
  text.className = "message-content";
  // Render as plain text to prevent HTML/script injection from model output.
  text.textContent = content;
  article.append(label, text);
  thread.append(article);
  article.scrollIntoView({ behavior: "smooth", block: "nearest" });
  return article;
}

function setChatMode(active) {
  document.body.classList.toggle("chat-active", active);
  if (active) {
    promptGrid.hidden = true;
    welcomeTitle.hidden = true;
    introCopy.hidden = true;
  } else {
    promptGrid.hidden = false;
    welcomeTitle.hidden = false;
    introCopy.hidden = false;
  }
}

async function sendMessage(rawMessage) {
  const message = rawMessage.trim();
  if (!message || sending) return;

  setChatMode(true);
  messages.push({ role: "user", content: message });
  addMessage("user", message);
  input.value = "";
  input.style.height = "auto";
  sending = true;
  const sendButton = form.querySelector(".send-button");
  sendButton.disabled = true;
  sendButton.textContent = "…";
  statusNote.textContent = "nova.ai is thinking…";
  const thinking = addMessage("assistant", "Thinking…", "thinking");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    const data = await response.json();
    thinking.remove();

    if (!response.ok) {
      const errorText = data.error || `Request failed (${response.status}).`;
      addMessage("assistant", `I couldn't complete that request: ${errorText}`);
      statusNote.textContent = "Please try again in a moment.";
      messages.pop();
      return;
    }

    messages.push({ role: "assistant", content: data.answer });
    addMessage("assistant", data.answer);
    statusNote.textContent = `Powered by Groq · ${data.model || "AI model"}`;
  } catch (error) {
    thinking.remove();
    addMessage("assistant", "I couldn't reach the nova.ai server. Please check the Worker deployment and try again.");
    statusNote.textContent = "Connection problem. Please try again.";
    messages.pop();
  } finally {
    sending = false;
    sendButton.disabled = false;
    sendButton.textContent = "↑";
    input.focus();
  }
}

document.querySelectorAll(".prompt-card").forEach((card) => {
  card.addEventListener("click", () => {
    input.value = card.dataset.prompt || "";
    input.focus();
  });
});

document.querySelector("#new-chat").addEventListener("click", () => {
  messages.length = 0;
  thread.replaceChildren();
  input.value = "";
  statusNote.textContent = "AI can make mistakes. Check important information.";
  setChatMode(false);
  input.focus();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
