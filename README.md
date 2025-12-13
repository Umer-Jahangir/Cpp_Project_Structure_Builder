# AutoAssignment Builder

AutoAssignment Builder is a web app that helps beginner CS students generate starter assignment projects automatically using the Cline CLI and an AI parsing agent (Kestra AI).

## Project Goal

Build a beginner-friendly, hackathon-ready web app that:

- Accepts an assignment description (TXT, PDF, DOCX) or pasted text.
- Uses Kestra AI to parse the assignment into a project structure, starter code, and documentation.
- Produces a Cline CLI workflow JSON that, when executed on the user's machine, creates the project folder and files.

## Tech Stack

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- AI Parsing: Kestra AI Agent
- Project Generation: Cline CLI
- Deployment: Vercel

## Features

1) Frontend

- Upload assignment file (TXT, PDF, DOCX) or paste text.
- Quick Start / Tutorial page with step-by-step instructions:
  - Installing Node.js
  - Installing Cline CLI
  - Download workflow JSON
  - Paste terminal command to generate project
- Download button for workflow JSON
- Display ready-to-copy CLI command with copy-to-clipboard
- Mobile-friendly UI

2) Backend

- API endpoint: `/api/generate`
- Accepts file upload or pasted text
- Sends text to Kestra AI Agent and receives structured output
- Converts AI output into Cline CLI workflow JSON
- Returns workflow JSON and a ready-to-copy Cline CLI command
- Graceful error handling with clear API responses

3) AI Agent (Kestra)

- Parses assignment text to produce:
  - Folder structure
  - Starter code skeletons for main files (C++, Python, Java)
  - `README.md` content
  - `docs/file_purpose.md` explaining each file
- Returns structured JSON suitable for the workflow generator

4) Workflow JSON Generator

- Converts AI JSON into Cline CLI workflow JSON with steps to create folders and files and include their contents
- Ensures compatibility with latest Cline CLI
- Returns workflow JSON and suggested CLI command

5) Terminal Instructions

- Provide platform-specific guidance (Windows, macOS, Linux)
- Suggest default output directory (Desktop) if user prefers

6) Cline CLI Execution

- Generates folders and files as defined in workflow JSON
- Uses beginner-friendly defaults and handles errors (file exists, invalid paths)

## API Contract

POST `/api/generate`

Request (multipart/form-data or JSON):

- `text` (string) — pasted assignment text OR
- `file` (file) — uploaded assignment file (txt, pdf, docx)

Response (application/json):

{
  "workflowJson": { /* Cline workflow JSON */ },
  "cliCommand": "cline run --workflow ./StudentRecords.workflow.json --output ~/Desktop/StudentRecords",
  "aiOutput": { /* raw AI JSON for inspection */ }
}

Error Response:

{
  "error": "Description of error",
  "details": { /* optional */ }
}

## Kestra AI JSON Schema (recommended)

The AI agent should return a JSON structure like:

{
  "project_name": "StudentRecords",
  "description": "C++ student records program",
  "folders": [
    {"path": "", "type": "dir"},
    {"path": "docs", "type": "dir"}
  ],
  "files": [
    {"path": "main.cpp", "language": "cpp", "content": "..."},
    {"path": "student.h", "language": "cpp", "content": "..."},
    {"path": "student.cpp", "language": "cpp", "content": "..."},
    {"path": "README.md", "language": "text", "content": "..."},
    {"path": "docs/file_purpose.md", "language": "text", "content": "..."}
  ],
  "run_instructions": "..."
}

The backend will map this to a Cline workflow JSON.

## Cline Workflow JSON (example)

An example workflow JSON entry for creating a file:

{
  "steps": [
    {"action": "mkdir", "path": "StudentRecords/docs"},
    {"action": "write", "path": "StudentRecords/README.md", "content": "..."}
  ],
  "metadata": {"project_name": "StudentRecords"}
}

The backend will return a downloadable `.workflow.json` file and a `cline run` command.

## Quick Start (for end users)

1. Install Node.js (LTS) from https://nodejs.org/
2. Install Cline CLI (follow Cline docs):

```
npm i -g cline-cli
```

3. From the web app, download the workflow JSON or copy the provided command.
4. Open a terminal and run the command (example for Windows PowerShell):

```
cd $HOME\Desktop
cline run --workflow .\StudentRecords.workflow.json --output .\StudentRecords
```

## Environment variables / local `.env`

Create a `.env` file in `backend/` containing:

```
KESTRA_API_URL=https://your-kestra-endpoint.example/agent
KESTRA_API_KEY=sk_xxx
MAX_UPLOAD_BYTES=4194304
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Use `npm run dev` in `backend/` and `frontend/` to run services locally. The frontend will proxy `/api` to `http://localhost:3000` when using the Vite dev server.

## Deployment

- Deploy frontend and backend to Vercel (use Vercel Serverless functions for the backend API).

## Example

Input text:

```
Create a C++ Student Records program:
- main.cpp, student.h, student.cpp
- Output average grades for students
- Include README.md and docs/file_purpose.md
```

Expected output: `StudentRecords` folder on Desktop with files above.

---

## Next Steps for Implementation

1. Scaffold `frontend/` and `backend/` folders with minimal `package.json` and `README.md`.
2. Implement `/api/generate` endpoint that accepts uploads and text.
3. Implement Kestra integration and workflow generator.

If you'd like, I can scaffold the minimal repo now (frontend + backend skeletons). Which step should I take next?

---
