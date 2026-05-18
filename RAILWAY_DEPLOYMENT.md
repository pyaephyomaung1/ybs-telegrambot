# How to Host Your Yangon Bus Bot on Railway (Free Trial)

This guide will help you host your NestJS Telegram bot on [Railway](https://railway.app/). Railway is a great alternative to Heroku and offers a free trial that is perfect for small projects.

## Prerequisites

1.  A [GitHub](https://github.com/) account with your project pushed to a repository.
2.  A [Telegram Bot Token](https://t.me/BotFather) (which you already have).

---

## Step 1: Create a Railway Account

1.  Go to [railway.app](https://railway.app/).
2.  Click **Login** and choose **GitHub**.
3.  Authorize Railway to access your GitHub account.

## Step 2: Create a New Project

1.  Click the **+ New Project** button.
2.  Select **Deploy from GitHub repo**.
3.  Choose your repository: `ybs-telegrambot`.
4.  Click **Deploy Now**.

## Step 3: Configure Environment Variables

Your bot needs the `TELEGRAM_BOT_TOKEN` to communicate with Telegram.

1.  Once the project is created, click on the **Service** (usually named after your repo).
2.  Go to the **Variables** tab.
3.  Click **+ New Variable** and add:
    *   **Variable Name:** `TELEGRAM_BOT_TOKEN`
    *   **Value:** `Your_Actual_Bot_Token_Here`
4.  Click **Add**.
5.  Railway will automatically redeploy your app with the new variable.

> **Note:** Railway automatically provides a `PORT` variable, so you don't need to add it manually.

## Step 4: Generate a Domain (Public URL)

To receive webhooks from Telegram, your app needs a public URL.

1.  Go to the **Settings** tab of your service.
2.  Under the **Networking** section, click **Generate Domain**.
3.  Railway will give you a URL like `https://ybs-telegrambot-production.up.railway.app`.
4.  **Copy this URL.**

## Step 5: Set Up the Telegram Webhook

Now you need to tell Telegram to send messages to your Railway URL instead of your local `ngrok` URL.

Replace `<YOUR_TOKEN>` and `<YOUR_RAILWAY_URL>` in the following link and open it in your browser:

```
https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<YOUR_RAILWAY_URL>/telegram/webhook
```

**Example:**
If your token is `123:ABC` and your Railway URL is `https://ybs-bot.up.railway.app`, the link would be:
`https://api.telegram.org/bot123:ABC/setWebhook?url=https://ybs-bot.up.railway.app/telegram/webhook`

If successful, you should see:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

---

## Important Notes

### 1. Railway Free Tier (Trial)
Railway provides a **Trial** plan with:
*   $5.00 one-time credit.
*   500 hours of execution time (per month).
*   The project will stop once the credit or hours are used up unless you upgrade to a Hobby plan ($5/month).

### 2. No Database Needed (For Now)
Currently, your bot uses **in-memory storage** for sessions. This means:
*   If the app restarts (which happens occasionally on Railway), the "current state" (e.g., if a user is in the middle of a search) will be reset to the Main Menu.
*   Since your bot is simple, this is usually fine. If you want to save user sessions permanently, you would need to set up a PostgreSQL database (which Railway makes very easy to add).

### 3. Monitoring
You can see your bot's logs by going to the **Logs** tab in your Railway project dashboard. This is very helpful for debugging if the bot doesn't respond.
