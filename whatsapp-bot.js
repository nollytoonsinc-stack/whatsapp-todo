const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

// FIX: Ensure crypto is available globally
if (!globalThis.crypto) {
  const { webcrypto } = require("crypto");
  globalThis.crypto = webcrypto;
}

// Data file for storing reminders
const DATA_FILE = "reminders.json";

// Load reminders from file
function loadReminders() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (err) {
    console.log("Error loading reminders:", err.message);
  }
  return {};
}

// Save reminders to file
function saveReminders(reminders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reminders, null, 2));
}

let reminders = loadReminders();
let sock;

// Parse time strings like "9am", "5:30pm", "tomorrow 9am"
function parseTime(timeStr) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let targetDate = now;
  let cleanTime = timeStr.toLowerCase();

  if (cleanTime.includes("tomorrow")) {
    targetDate = tomorrow;
    cleanTime = cleanTime.replace("tomorrow", "").trim();
  }

  const timeMatch = cleanTime.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const meridiem = timeMatch[3]?.toLowerCase();

  if (meridiem === "pm" && hours !== 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate;
}

// Schedule a reminder
function scheduleReminder(jid, taskId, reminderTime, task) {
  const now = new Date();
  const delay = reminderTime.getTime() - now.getTime();

  if (delay > 0) {
    setTimeout(() => {
      if (reminders[jid]?.[taskId]) {
        const msg = `⏰ Reminder: ${task}`;
        sock.sendMessage(jid, { text: msg });
        console.log(`Sent reminder to ${jid}: ${task}`);
      }
    }, delay);
  }
}

// Initialize WhatsApp bot
async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("Reconnecting...");
        connectWhatsApp();
      }
    } else if (connection === "open") {
      console.log("✅ WhatsApp bot connected!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    console.log(`Message from ${jid}: ${text}`);

    let response = "";

    if (!reminders[jid]) reminders[jid] = {};

    const cmd = text.toLowerCase().trim();

    if (cmd.startsWith("remind me to ") || cmd.startsWith("todo ")) {
      const taskText = cmd
        .replace("remind me to ", "")
        .replace("todo ", "");
      const parts = taskText.match(/(.*?)\s+(at|by)\s+(.*)/i);

      if (parts) {
        const task = parts[1].trim();
        const timeStr = parts[3].trim();
        const reminderTime = parseTime(timeStr);

        if (reminderTime) {
          const taskId = Date.now().toString();
          reminders[jid][taskId] = {
            task,
            time: reminderTime.toISOString(),
            completed: false,
          };
          saveReminders(reminders);
          scheduleReminder(jid, taskId, reminderTime, task);

          const timeDisplay = reminderTime.toLocaleString();
          response = `✅ Reminder set!\n📝 ${task}\n⏰ ${timeDisplay}`;
        } else {
          response = "❌ Couldn't parse the time. Try: 'remind me to buy milk at 9am'";
        }
      } else {
        response = "❌ Format: remind me to [task] at [time]";
      }
    } else if (cmd === "list" || cmd === "reminders") {
      const userReminders = reminders[jid];
      if (Object.keys(userReminders).length === 0) {
        response = "📋 No reminders yet.";
      } else {
        response = "📋 Your reminders:\n\n";
        Object.entries(userReminders).forEach(([id, reminder], idx) => {
          if (!reminder.completed) {
            const time = new Date(reminder.time).toLocaleString();
            response += `${idx + 1}. ${reminder.task} - ${time}\n`;
          }
        });
      }
    } else if (cmd.startsWith("done ")) {
      const taskNum = parseInt(cmd.replace("done ", "")) - 1;
      let idx = 0;
      for (const [id, reminder] of Object.entries(reminders[jid])) {
        if (!reminder.completed) {
          if (idx === taskNum) {
            reminders[jid][id].completed = true;
            saveReminders(reminders);
            response = `✅ Task marked complete: ${reminder.task}`;
            break;
          }
          idx++;
        }
      }
      if (!response) response = "❌ Invalid task number";
    } else if (cmd === "help") {
      response = `📱 WhatsApp Todo & Reminder Bot\n\nCommands:\n• remind me to [task] at [time]\n• todo [task] by [time]\n• list\n• done [number]\n• help`;
    } else {
      response = `Hi! 👋 I'm your todo & reminder bot.\n\nTry:\n"remind me to buy milk at 9am"\n\nType "help" for commands.`;
    }

    await sock.sendMessage(jid, { text: response });
  });
}

console.log("Starting WhatsApp bot...");
connectWhatsApp().catch((err) => {
  console.error("Error connecting:", err);
  process.exit(1);
});
