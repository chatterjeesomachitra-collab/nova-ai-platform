const form = document.querySelector("#chat-form");
const input = document.querySelector("#prompt-input");
const status = document.querySelector("#status-note");

document.querySelectorAll(".prompt-card").forEach((card) => {
  card.addEventListener("click", () => {
    input.value = card.dataset.prompt || "";
    input.focus();
  });
});

document.querySelector("#new-chat").addEventListener("click", () => {
  input.value = "";
  input.focus();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  status.textContent = "Your message is ready. AI responses will be enabled when we connect the secure API in a later phase.";
  input.value = "";
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
});