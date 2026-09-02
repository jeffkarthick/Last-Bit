let personalityProfile = null;
let chatHistory = [];

const fileInput = document.getElementById("fileInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const status = document.getElementById("status");

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


// ============================
// FILE SELECT
// ============================

fileInput.addEventListener("change", () => {

  const file = fileInput.files[0];

  if (!file) {
    status.textContent = "";
    return;
  }

  console.log("Selected file:", file.name);

  if (!file.name.toLowerCase().endsWith(".txt")) {

    status.textContent =
      "❌ Please select a .txt file.";

    fileInput.value = "";

    return;
  }

  status.textContent =
    `✅ Selected: ${file.name}`;

});


// ============================
// ANALYZE
// ============================

analyzeBtn.addEventListener("click", async () => {

  const file = fileInput.files[0];

  if (!file) {

    status.textContent =
      "❌ முதலில் WhatsApp TXT file select பண்ணு.";

    return;
  }

  try {

    analyzeBtn.disabled = true;

    status.textContent =
      "📖 Reading WhatsApp chat...";

    // Read TXT file
    const text = await file.text();

    console.log("File size:", text.length);

    if (!text || !text.trim()) {

      throw new Error(
        "TXT file empty-ஆ இருக்கு."
      );

    }

    status.textContent =
      "🧠 Sending chat to AI...";


    const response = await fetch(
      "/api/analyze",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          chat: text
        })
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI analysis failed"
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
      "✅ Chat analyzed successfully!";

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


// ============================
// SHOW ANALYSIS
// ============================

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
    Array.isArray(profile.interests)
  ) {

    addItem(
      "Interests",
      profile.interests.join(", ")
    );

  }


  if (
    Array.isArray(profile.common_topics)
  ) {

    addItem(
      "Common Topics",
      profile.common_topics.join(", ")
    );

  }


  if (
    Array.isArray(profile.important_patterns)
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

  const titleElement =
    document.createElement("strong");

  titleElement.textContent =
    title;

  const valueElement =
    document.createElement("div");

  valueElement.textContent =
    value || "Unknown";

  div.appendChild(titleElement);
  div.appendChild(valueElement);

  analysis.appendChild(div);

}


// ============================
// START CHAT
// ============================

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


// ============================
// SEND CHAT
// ============================

sendBtn.addEventListener(
  "click",
  sendMessage
);


messageInput.addEventListener(
  "keydown",
  (event) => {

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

    alert(
      "First analyze a WhatsApp chat."
    );

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
      await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            profile:
              personalityProfile,

            message,

            history:
              chatHistory.slice(-8)

          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Chat failed"
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


// ============================
// MESSAGE
// ============================

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
