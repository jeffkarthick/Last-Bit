let personalityProfile = null;

let chatHistory = [];


const fileInput =
  document.getElementById("fileInput");

const analyzeBtn =
  document.getElementById("analyzeBtn");

const status =
  document.getElementById("status");

const analysisSection =
  document.getElementById("analysisSection");

const analysis =
  document.getElementById("analysis");

const startChatBtn =
  document.getElementById("startChatBtn");

const chatSection =
  document.getElementById("chatSection");

const messages =
  document.getElementById("messages");

const messageInput =
  document.getElementById("messageInput");

const sendBtn =
  document.getElementById("sendBtn");


/* -----------------------------
   ANALYZE CHAT
----------------------------- */

analyzeBtn.addEventListener("click", async () => {

  const file = fileInput.files[0];

  if (!file) {
    status.textContent =
      "Please select a WhatsApp .txt file.";
    return;
  }

  if (!file.name.endsWith(".txt")) {
    status.textContent =
      "Only .txt files are supported.";
    return;
  }

  try {

    analyzeBtn.disabled = true;

    status.textContent =
      "🧠 Reading and analyzing chat...";

    const text =
      await file.text();

    if (!text.trim()) {
      throw new Error("File is empty.");
    }

    const response =
      await fetch("/api/analyze", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          chat: text
        })

      });


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.error || "Analysis failed"
      );
    }


    personalityProfile =
      data.profile;


    showAnalysis(
      personalityProfile
    );


    analysisSection.classList.remove(
      "hidden"
    );

    status.textContent =
      "✅ Analysis completed.";

  }

  catch (error) {

    console.error(error);

    status.textContent =
      "❌ " + error.message;

  }

  finally {

    analyzeBtn.disabled = false;

  }

});


/* -----------------------------
   DISPLAY ANALYSIS
----------------------------- */

function showAnalysis(profile) {

  analysis.innerHTML = "";

  addItem(
    "Personality",
    profile.personality
  );

  addItem(
    "Communication Style",
    profile.communication_style
  );

  addItem(
    "Mood",
    profile.mood
  );

  addItem(
    "Relationship Style",
    profile.relationship_style
  );

  addItem(
    "Language Style",
    profile.language_style
  );


  if (
    profile.interests &&
    profile.interests.length
  ) {

    addItem(
      "Interests",
      profile.interests.join(", ")
    );

  }


  if (
    profile.common_topics &&
    profile.common_topics.length
  ) {

    addItem(
      "Common Topics",
      profile.common_topics.join(", ")
    );

  }


  if (
    profile.important_patterns &&
    profile.important_patterns.length
  ) {

    addItem(
      "Patterns",
      profile.important_patterns.join(" • ")
    );

  }

}


function addItem(title, value) {

  const div =
    document.createElement("div");

  div.className =
    "analysis-item";

  div.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <div>${escapeHtml(
      String(value || "Unknown")
    )}</div>
  `;

  analysis.appendChild(div);

}


/* -----------------------------
   START CHAT
----------------------------- */

startChatBtn.addEventListener(
  "click",
  () => {

    chatSection.classList.remove(
      "hidden"
    );

    chatSection.scrollIntoView({
      behavior: "smooth"
    });

    messageInput.focus();

  }
);


/* -----------------------------
   SEND MESSAGE
----------------------------- */

sendBtn.addEventListener(
  "click",
  sendMessage
);


messageInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      sendMessage();
    }

  }
);


async function sendMessage() {

  const message =
    messageInput.value.trim();

  if (!message) return;

  if (!personalityProfile) {
    return;
  }


  addMessage(
    "user",
    message
  );


  messageInput.value = "";

  sendBtn.disabled = true;


  const loading =
    addMessage(
      "ai",
      "Typing..."
    );


  try {

    const response =
      await fetch("/api/chat", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          profile:
            personalityProfile,

          message,

          history:
            chatHistory.slice(-8)

        })

      });


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.error || "Chat failed"
      );
    }


    loading.remove();


    addMessage(
      "ai",
      data.reply
    );


    chatHistory.push({
      role: "user",
      content: message
    });


    chatHistory.push({
      role: "assistant",
      content: data.reply
    });


    chatHistory =
      chatHistory.slice(-8);

  }

  catch (error) {

    loading.textContent =
      "❌ " + error.message;

  }

  finally {

    sendBtn.disabled = false;

    messageInput.focus();

  }

}


/* -----------------------------
   ADD MESSAGE
----------------------------- */

function addMessage(
  type,
  text
) {

  const div =
    document.createElement("div");

  div.className =
    "message " + type;

  div.textContent =
    text;

  messages.appendChild(div);

  messages.scrollTop =
    messages.scrollHeight;

  return div;

}


/* -----------------------------
   SECURITY
----------------------------- */

function escapeHtml(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text;

  return div.innerHTML;

}
