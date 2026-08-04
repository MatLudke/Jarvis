# Jarvis Alexa Skill (Lambda + Google Gemini)

Deployable Alexa Custom Skill backend on AWS Lambda using Google Gemini (AI Studio). This project uses Gemini 3.5 Flash as the conversational model for Alexa responses.

## What this project includes

- Alexa Custom Skill handler built with ASK SDK.
- Google Gemini (AI Studio) integration via API key and endpoint.
- Short in-session conversation memory.
- AWS SAM template for deployment.
- Unit tests and GitHub Actions CI for lint/build/test.

## Prerequisites

- Node.js 20+
- AWS CLI configured
- AWS SAM CLI installed
- Alexa Developer Console account
- Google AI Studio (Gemini) API key and endpoint

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build:

   ```bash
   npm run build
   ```

3. Set Lambda environment variables (in SAM params or console):

- `GEMINI_API_KEY` (required)
- `GEMINI_API_URL` (required) — AI Studio REST endpoint
- `GEMINI_MODEL` (optional, default `gemini-3.5-flash`)
- `MAX_SESSION_TURNS` (optional, default `4`)

## Test and lint

```bash
npm run lint
npm test
```

## Deploy with SAM (example region us-east-1)

1. Build SAM artifacts:

   ```bash
   sam build
   ```

2. Deploy guided:

   ```bash
   sam deploy --guided --region us-east-1
   ```

3. Copy the deployed Lambda ARN and configure it in Alexa Developer Console:
   - Build > Endpoint > AWS Lambda ARN
   - Choose the correct region (e.g., us-east-1)

## Alexa Skill configuration

Use files in `alexa/skill-package/`:

- `skill.json` (manifest)
- `interactionModels/custom/en-US.json` (intent model)

In Alexa Developer Console:

1. Create a new custom skill.
2. Set invocation name to `jarvis` (or import the provided model).
3. Import/update interaction model from `en-US.json`.
4. Set Lambda endpoint ARN.
5. Build and test.

## Example utterances

- "Alexa, open jarvis"
- "Alexa, ask jarvis what is serverless computing"
- "Alexa, ask jarvis explain Lambda cold starts"

## Publish to GitHub

1. Create a new repository (e.g., https://github.com/MatLudke/Jarvis).
2. Commit this project (never commit real API keys).
3. Push:

   ```bash
   git init
   git add .
   git commit -m "Initial Jarvis Alexa skill project"
   git branch -M main
   git remote add origin https://github.com/MatLudke/Jarvis.git
   git push -u origin main
   ```
