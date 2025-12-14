# C++ Project Structure Builder

C++ Project Structure Builder generates beginner-friendly C++ starter projects from an assignment description by orchestrating AI and automation.

Repository layout
- `frontend/` — Vite + React application that sends assignment text to a Kestra webhook and downloads generated project zips
- `builder.yaml` — an example Kestra workflow (install it in your Kestra instance). 

The workflow:

  - Calls Google Gemini to generate a JSON project structure
  - Validates and sanitizes AI output
  - Creates files and folders and produces `project.zip` (and an `artifact.json` manifest)

Note: For Kestra installation, see the official Kestra documentation or the Kestra project site for Docker and cloud deployment options.

Summary
- The frontend triggers a Kestra webhook with `assignment_text`. The Kestra workflow runs, produces a zip of the generated starter project, and the frontend polls for completion and downloads the resulting file.

Demo
- Watch the project demo video: [Watch the demo](https://youtu.be/chp_SeIY_eg)

Prerequisites
- Node 18+ and npm/yarn installed locally.
- A running Kestra instance with the `Google Gemini` provider configured and a `GEMINI_API_KEY` secret.
- A Kestra webhook configured (namespace/flow/key) to trigger the included workflow.

Features
- Generate a C++ project skeleton (headers, implementation, Makefile, README) from a short description
- Validates the AI-produced JSON and sanitizes code strings
- Produces a downloadable zip bundle with an artifact manifest

Quickstart (local frontend)
1. Clone the repo.
2. Start the frontend dev server:
```bash
cd frontend
npm install
npm run dev
```
To build and preview a production build locally:
```bash
npm run build
npm run preview
```

Environment variables (frontend/.env)
```env
VITE_KESTRA_URL=http://localhost:8080
VITE_TENANT_ID=main
VITE_KESTRA_USERNAME=yourKestraUser
VITE_KESTRA_PASSWORD=yourKestraPassword
VITE_WEBHOOK_NAMESPACE=your-namespace
VITE_WEBHOOK_FLOW=your-flow-id
# Optional: For local dev proxy set VITE_API_URL=http://localhost:8080
VITE_WEBHOOK_KEY=<your-webhook-key>
```

How it works (flow)
1. Frontend posts to Kestra webhook: `/api/v1/{tenant}/executions/webhook/{namespace}/{flow}/{key}` with `{ assignment_text }`.
2. `generate_project_structure` uses the Gemini plugin to return JSON (project_name, folders, files, readme).
3. `fix_and_validate_structure` validates and cleans the JSON (fixing encoding issues and double-encoded strings).
4. `create_files_and_zip` writes files, creates a zip (`project.zip`) and writes an `artifact.json` map.
5. Frontend polls Kestra; when the workflow completes it downloads `project.zip` via a secure endpoint. The workflow exposes a `download` output ID (a file path) that the frontend reads and uses to fetch the zip. If you rename this output, update the UI accordingly.

Test the webhook by triggering it manually (replace placeholders):

```bash
curl -X POST -H "Content-Type: application/json" -u "${KESTRA_USER}:${KESTRA_PASS}" \
  -d '{"assignment_text":"Create a simple C++ calculator program with a classes and file handling"}' \
  "${KESTRA_URL}/api/v1/${TENANT}/executions/webhook/${NAMESPACE}/${FLOW}/${KEY}"
```

Replace environment placeholders with your actual values.

Kestra-specific notes
- The Gemini plugin requires a Kestra secret `GEMINI_API_KEY` configured in your Kestra instance.
- The workflow writes `artifact.json` with a mapping for artifacts; adjust UI code if you change output names.
- Install the workflow to your Kestra instance by importing the YAML file (`builder.yaml` or `Untitled-1.yaml`) through the Kestra UI (Workflows → Create/Import) or using the Kestra CLI.

Deployment
- Frontend: deploy to static hosting (Vercel recommended). Set `frontend/` as the project root, `dist` as the build output directory, and use `npm run build` as the build command.
  - Vercel: set `Frontend` > `Build Command` to `npm run build`, `Output Directory` to `dist`, and set the environment variables under your project settings.
- Kestra: run the workflow in a hosted Kestra or a local Kestra instance. Make sure the webhook is reachable by the frontend.

Troubleshooting
- Missing env variables: Ensure `VITE_KESTRA_URL`, `VITE_KESTRA_USERNAME`, and `VITE_KESTRA_PASSWORD` are set. Local proxy tests can use `VITE_API_URL`.
- AI returns wrapped output or invalid JSON: The `fix_and_validate_structure` step attempts to unwrap `predictions` and parse top-level JSON strings. Check execution logs for the debug prints noting the structure of the JSON received.
- CORS or network issues: When testing locally, use the Vite proxy (set `VITE_API_URL`) or configure Kestra to allow requests from your development host.
- Download output missing: The UI expects a `download` output file path; ensure your workflow output declaration includes a `download` FILE output and that `create_files_and_zip` writes a `project.zip` and `artifact.json`.

Security
- Do not commit `.env` files or secrets. Use Kestra secrets for production credentials.
- If a `.env` containing credentials was used to build the frontend, those credentials may be embedded in the built `dist` assets. If you committed built assets (or `frontend/.env`) with secrets, remove them, rotate the credentials, and re-build the frontend.
- If you accidentally committed a `.env` file, remove it and rotate any exposed credentials (example):

```bash
# Remove the file from the repo while keeping it locally
git rm --cached frontend/.env
git commit -m "Remove sensitive .env"
# For history rewriting you can use tools like git-filter-repo or BFG (advanced and irreversible):
# git filter-repo --path frontend/.env --invert-paths
```

Contributing
- Contributions welcome — open issues or PRs to improve the AI prompts, validation, and frontend UX.
