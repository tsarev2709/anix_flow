# Here are your Instructions

## GPT Script Generation MVP

The script editor can now request fresh scene breakdowns from the backend, which proxies calls to the OpenAI API. To enable the new flow:

1. Create `backend/.env` (or supply real environment variables) with the following values:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=anix_flow
   OPENAI_API_KEY=sk-...
   # Optionally override:
   # OPENAI_MODEL=gpt-4o-mini
   # OPENAI_API_BASE=https://api.openai.com/v1
   ```
2. Install backend dependencies and start the API server:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn server:app --reload
   ```
3. Start the frontend (default backend URL is `http://localhost:8000`):
   ```bash
   cd frontend
   yarn install
   yarn start
   ```

`ScriptSection` now POSTs to `/api/generate-script`, sending the user prompt and narrator choice. The backend validates the model response, normalises scene IDs and durations, and returns JSON that immediately populates the UI. Any failure along the way surfaces as a toast in the interface.
