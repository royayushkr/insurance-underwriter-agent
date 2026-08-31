# Insurance Underwriter Agent

Insurance Underwriter Agent is an AI-powered underwriting research workspace built with [Tavily](https://tavily.com). Enter a company name and optional location to generate a source-backed company report in real time.

The application is designed for an underwriter's first-pass diligence workflow. It gathers public information across company profile, adverse news, risk, products and services, and claims history, then presents the results in a streamed dashboard with source links.

## How it works

```text
Browser (React + Vite)
        │  POST /api/underwrite/stream
        ▼
FastAPI backend
        │  starts five parallel research tasks
        ▼
Tavily Research API
        │  streams SSE events and sources
        ▼
Backend orchestrator
        │  tags, aggregates, and forwards events
        ▼
Live underwriting dashboard
```

1. The React frontend sends a company and optional location to the FastAPI backend.
2. The backend runs five research categories in parallel using Tavily's streaming Research API.
3. Progress updates, discovered sources, and completed category data are forwarded as Server-Sent Events (SSE).
4. When Company Information identifies executives, a supplemental LinkedIn lookup runs for matching profile URLs.
5. The dashboard updates as results arrive and keeps the supporting sources available for review.

This tool supports research and review; it does not make an automated underwriting decision.

[![Demo Video](https://img.youtube.com/vi/Hhpvn4iYxGM/maxresdefault.jpg)](https://www.youtube.com/watch?v=Hhpvn4iYxGM)

## Getting Started

### 1. Clone and configure environment

```bash
cp .env.sample .env
```

Open `.env` and set your Tavily API key:

```
TAVILY_API_KEY=tvly-your-key-here
```

### 2. Start the backend

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m backend.app
```

The API server starts at **http://localhost:8000**.

### 3. Start the frontend

In a separate terminal:

```bash
cd ui
npm install
npm run dev
```

The UI opens at **http://localhost:5173**.

## Usage

1. Open **http://localhost:5173** in your browser.
2. Enter a company name (and optional location).
3. Results stream in across five research categories:
   - **Company Information** — legal name, industry, NAICS code, employees, revenue, leadership
   - **Adverse News** — lawsuits, regulatory actions, negative press (last 5 years)
   - **Risk Assessment** — financial health, credit ratings, operational/compliance risks, ESG, overall rating
   - **Products & Services** — product lines, markets served, competitive position
   - **Claims History** — insurance claims, loss records, workplace safety, product liability

## Project Structure

```
├── .env.sample                  # Environment variable template
├── requirements.txt             # Python dependencies
├── backend/
│   ├── app.py                   # FastAPI entry point
│   ├── models.py                # Pydantic request/response models
│   ├── research_tasks.py        # Research category configurations
│   └── streaming/
│       ├── event_handler.py     # Processes Tavily stream events
│       ├── stream_orchestrator.py  # Parallel research orchestration
│       └── tavily_stream.py     # Tavily API streaming client
└── ui/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx             # React entry point
        ├── App.tsx              # Main application component
        ├── types.ts             # TypeScript type definitions
        └── components/
            ├── Header.tsx
            ├── SearchForm.tsx
            ├── ProgressTracker.tsx
            ├── ResultsDashboard.tsx
            ├── CategoryCard.tsx
            ├── CompanyInfo.tsx
            ├── AdverseNews.tsx
            ├── RiskAssessment.tsx
            ├── ProductsServices.tsx
            ├── ClaimsHistory.tsx
            └── SourcesList.tsx
```

## Environment Variables

| Variable         | Required | Description                                                                 |
| ---------------- | -------- | --------------------------------------------------------------------------- |
| `TAVILY_API_KEY` | Yes      | Your Tavily API key. Can also be passed via the `Authorization` header.     |

## API

### `POST /api/underwrite/stream`

Streams underwriting research results as Server-Sent Events (SSE).

**Request body:**

```json
{
  "company_name": "Acme Corp",
  "location": "New York, NY"
}
```

**Response:** `text/event-stream` with real-time research updates per category.
