# Study Buddy AI

A beginner-friendly PDF study assistant built with HTML, CSS, JavaScript, Node.js and the Gemini API.

## Features
- Responsive dashboard inspired by the Study Buddy visual mockup
- PDF upload and in-browser text extraction (PDF.js)
- AI summaries, simple explanations, MCQ generation and quiz question generation
- Copy generated output
- Basic activity counters

## Requirements
- Node.js 18 or newer
- A Gemini API key from https://aistudio.google.com/app/apikey
- Internet connection (for Gemini API, Google Fonts and PDF.js CDN)

## Run on your computer

1. Extract the ZIP file.
2. Open the extracted `study-buddy-ai` folder in VS Code.
3. Open the VS Code terminal in that folder.
4. Install packages:

   ```bash
   npm install
   ```

5. Create your private environment file by copying `.env.example` to `.env`.
6. Open `.env` and replace `put_your_key_here` with your Gemini API key.
7. Start the website:

   ```bash
   npm start
   ```

8. Open http://localhost:3000 in your browser.

## Important API-key safety
Keep the key in `.env`. Never paste it into `public/app.js`, `public/index.html`, a public GitHub repository, or a screenshot. The `.gitignore` file excludes `.env`.

## Notes and limitations of this first version
- PDF text is extracted in the browser. Scanned/image-only PDFs need OCR and are not supported yet.
- One request is limited to 90,000 extracted characters.
- Generated quiz questions are displayed as study material; automatic answer selection and grading can be added as a next feature.
- Progress counters are temporary and reset when the page is refreshed.
- For public deployment, add authentication, rate limiting, usage limits and stronger file/input validation before sharing widely.
- Gemini model availability and quotas depend on your Google AI Studio project and current API access. If `gemini-3.8-flash` is unavailable to your account, change the model name in `server.js` to a model currently listed in your AI Studio account.

## Project structure

```text
study-buddy-ai/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── server.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```
