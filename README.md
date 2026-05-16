<p align="center">
  <img src="public/image/logo.png" alt="YBS Helper Bot Logo" width="120" height="120" style="border-radius: 50%" />
</p>

<h1 align="center">🚌 YBS Helper Bot</h1>

<p align="center">
  A Telegram bot for searching Yangon Bus Service (YBS) routes and stops easily.
</p>

<p align="center">
  <a href="https://t.me/yangonbusbot">
    <img src="https://img.shields.io/badge/Telegram-@yangonbusbot-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Bot" />
  </a>
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## 📖 About

**YBS Helper Bot** is a Telegram chatbot that helps Yangon commuters search for bus routes and stops quickly — without needing to browse websites or ask around.

Built as a school project by **Pyae Phyo Maung**, with data entry support from **Min Kaung Han** and **Aung Zay Ya**.

> ရန်ကုန်ယာဥ်လိုင်းများနှင့် မှတ်တိုင်များကို လွယ်ကူစွာ ရှာဖွေနိုင်သည်။

---

## ✨ Features

- 🚌 **Search by Bus Line** — Enter a bus number and get all stops in order
- 🚏 **Search by Stop Name** — Enter a stop name and see which buses pass through
- 🏙️ **Township disambiguation** — If the same stop name exists in multiple townships, the bot asks you to pick the right one
- 💬 **Burmese language support** — Responses in Myanmar language
- 🗄️ **Persistent sessions** — Conversation state stored in PostgreSQL

---

## 📱 How to Use

### 1. Start the Bot

Open [@yangonbusbot](https://t.me/yangonbusbot) on Telegram and press **Start**.
The bot will greet you with the main menu.

<p align="center">
  <img src="public/image/screenshot-1.webp" alt="YBS Bot Home Screen" width="320" />
</p>

---

### 2. Search by Bus Line Number

Tap **"🚌 ယာဥ်လိုင်းနံပါတ်ဖြင့် ရှာရန်"**, then type a bus number (e.g. `4`, `7`, `43`).
The bot returns all stops for that route in order.

<p align="center">
  <img src="public/image/screenshot-2.webp" alt="Search by Bus Number" width="320" />
</p>

---

### 3. Search by Stop Name

Tap **"🚏 မှတ်တိုင်ဖြင့်ရှာရန်"**, then type a stop name.
The bot shows all bus lines that pass through that stop.

If the same stop name exists in multiple townships, the bot will ask you to choose the correct one.

<p align="center">
  <img src="public/image/screenshot-3.webp" alt="Search by Stop Name" width="320" />
</p>


---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | NestJS + TypeScript |
| Database | Seeding + TypeORM |
| Messaging | Telegram Bot API |
| Architecture | Webhook-based, State Machine pattern |

---


## 👥 Credits

| Role | Name |
|---|---|
| 👨‍💻 Developer | [Pyae Phyo Maung](https://github.com/pyaephyomaung1) |
| 📊 Data Entry | Min Kaung Han |
| 📊 Data Entry | Aung Zay Ya |

---

## 📦 Source Code

[github.com/pyaephyomaung1/ybs-telegrambot](https://github.com/pyaephyomaung1/ybs-telegrambot)

---
