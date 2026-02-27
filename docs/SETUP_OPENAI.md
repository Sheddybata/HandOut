# Setup: OpenAI API for summary & quiz

## Tool

The app uses **OpenAI** (GPT-4o-mini) to generate:

- **Detailed summary** from your PDF (targeting about 2–4 pages)
- **Quiz** (20 multiple-choice questions, 4 options each)

Results are **saved to the signed-in user’s account** and listed on the **Saved** tab.

---

## Get your API key

1. Go to **[https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)** and sign in (or create an account).
2. Add a payment method under **Billing** if required (usage for testing is usually a few cents).
3. Click **“Create new secret key”**, name it (e.g. “Handout dev”), copy the key (it starts with `sk-`).
4. **Do not commit or share this key.** Use it only in `.env.local` on your machine.

---

## Add the key to `.env.local`

1. In the project root (`handout/`), copy the example env file:
   - **Windows (PowerShell):** `Copy-Item .env.example .env.local`
   - **Mac/Linux:** `cp .env.example .env.local`
2. Open `.env.local` and set your OpenAI key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Keep your existing NextAuth vars in `.env.local` (e.g. `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).

---

## How to test

1. **Start the app:** `npm run dev`
2. **Sign in** (or sign up) so handouts are tied to your account.
3. **Home → Upload** a **PDF** (e.g. a lecture slide or article). Only PDFs are supported for AI.
4. Wait for “Generating summary…” to finish. Summary and quiz will load and are **saved automatically** to your account.
5. Open the **Saved** tab to see the handout; click it to open the summary and quiz again.
6. Use **Download PDF Summary** to export the keypoints as a PDF.

If you see **“OPENAI_API_KEY is not set”**, check that `.env.local` exists, contains `OPENAI_API_KEY=sk-...`, and restart `npm run dev`.
