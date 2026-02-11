# 🤖 AI Chat Assistant

Sebuah aplikasi web asisten cerdas berbasis AI yang dirancang untuk memberikan pengalaman percakapan yang interaktif dan kaya fitur. Aplikasi ini dibangun menggunakan arsitektur modern Next.js (App Router) dan mendukung berbagai mode interaksi pengguna.

## ✨ Fitur Utama

- **Smart AI Chat**: Endpoint API khusus (`/api/chat`) untuk memproses dan merespons obrolan pengguna dengan kecerdasan buatan.
- **Voice/Speech Recognition**: Pengguna dapat berbicara langsung ke aplikasi menggunakan suara yang akan diubah menjadi teks (menggunakan custom hook `useSpeechRecognition`).
- **File Upload**: Dukungan pengunggahan file (`/api/upload`) untuk dianalisis atau diproses lebih lanjut oleh AI.
- **AI Tools Integration**: Dilengkapi dengan sistem *tools/function calling* (`src/lib/tools`) yang memungkinkan AI melakukan tugas-tugas spesifik.

## 💻 Teknologi yang Digunakan

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library UI**: [React.js](https://react.dev/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 🚀 Cara Menjalankan Project Secara Lokal

Ikuti langkah-langkah berikut untuk menjalankan aplikasi ini di komputer Anda:

### Prasyarat
Pastikan Anda sudah menginstal **Node.js** dan **npm** (atau package manager lain seperti pnpm/yarn) di komputer Anda. Anda mungkin juga memerlukan API Key dari provider AI (seperti OpenAI, Gemini, dll) tergantung pada implementasi di `/api/chat`.

### 1. Clone Repository
```bash
git clone https://github.com/andre-sptr/ai.git
