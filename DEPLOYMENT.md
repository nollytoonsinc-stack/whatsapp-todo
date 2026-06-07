# 🤖 WhatsApp Todo Bot - Free Deployment Guide

## ✅ What You Get
- Free WhatsApp bot (no Twilio costs)
- Save todos and reminders via text
- Automatic reminders sent to you
- Persistent storage

## 🚀 Deploy to Replit (5 mins)

### Step 1: Create Replit Account
1. Go to https://replit.com (free)
2. Sign up

### Step 2: Create New Replit
1. Click **+ Create** → **New Replit**
2. Choose **Node.js** template
3. Name it: `whatsapp-todo-bot`

### Step 3: Add Files
1. Copy `whatsapp-bot.js` → paste into `main.js` in Replit
2. Copy `package.json` → replace Replit's package.json
3. Replit auto-installs dependencies

### Step 4: Run & Scan QR Code
1. Click **Run** button
2. You'll see a **QR code in the console**
3. Open WhatsApp on your phone
4. **Settings → Linked Devices → Link a Device**
5. **Scan the QR code** with your phone camera
6. ✅ Bot is now connected!

## 📝 How to Use

Text your WhatsApp number (the one you scanned) with commands:

```
remind me to buy milk at 9am
todo finish report by 5:30pm
list
done 1
help
```

### Time Formats
- `9am` `3:30pm` (today)
- `tomorrow 10am` (next day)
- `5:30pm` (today)

## 🔧 Keep It Running Forever (Free)

Replit stops free projects after inactivity. **Use Replit's built-in Uptime (free tier available):**

1. In your Replit, click **Tools** (bottom left)
2. Enable **Always On** (or Uptime feature if available)
3. Your bot runs 24/7

**Alternative**: Use a simple uptime pinger like:
- https://uptimerobot.com (free tier, pings your bot every 5 mins)

## 📊 How It Works

- **Baileys Library**: Connects to WhatsApp Web (free, no official API needed)
- **Node-Cron**: Schedules reminders to send at the right time
- **JSON Storage**: Saves all reminders locally (persists between restarts)

## ⚠️ Important Notes

- Your phone number must be active (Baileys uses WhatsApp Web)
- Don't use this number on another device while the bot is running
- Keep the Replit project running (enable Always On or Uptime pinger)
- Reminders only work while the bot is running

## 🆘 Troubleshooting

**Bot won't start?**
- Check Node version (should be 18.x)
- Click Run again

**QR code not scanning?**
- Make sure WhatsApp is updated
- Try scanning on a different device first

**Not receiving reminders?**
- Check bot is still running (green "Running" indicator)
- Make sure time format is correct (e.g., "9am" not "9:00am")

## 🚀 Next Steps (Optional)

- Add a database (MongoDB Atlas free tier) for more users
- Deploy to Railway, Fly.io, or Render for better uptime
- Add more features (recurring reminders, sync to Google Calendar, etc.)

---

**That's it! You now have a free WhatsApp bot.** 🎉
