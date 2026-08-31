"""FastAPI server for the underwriter agent."""

import os
import sys
import logging
import json
import asyncio
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

# Ensure backend package is importable
backend_dir = Path(__file__).parent
project_dir = backend_dir.parent
if str(project_dir) not in sys.path:
    sys.path.insert(0, str(project_dir))

from backend.models import UnderwriteRequest
from backend.streaming import run_underwrite_research

load_dotenv(project_dir / ".env")

frontend_origin = os.getenv("FRONTEND_ORIGIN")
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
if frontend_origin:
    allowed_origins.append(frontend_origin.rstrip("/"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


async def demo_underwrite_stream(
    company_name: str,
    location: str | None,
) -> AsyncGenerator[str, None]:
    """Return deterministic demo results when live research is not configured."""
    categories = [
        ("company_info", {
            "legal_name": company_name,
            "summary": "Demo mode: live web research is disabled because no Tavily API key is configured. Verify all company facts before underwriting.",
            "website": "",
            "address": location or "Not provided",
            "industry": "Not researched",
            "naics_code": "Not researched",
            "employees": "Not researched",
            "revenue": "Not researched",
            "founded": "Not researched",
            "leadership": "",
            "ownership": "Not researched",
        }),
        ("adverse_news", {
            "adverse_items": "[]",
            "summary": "Demo mode: adverse-news research was not performed. No conclusion can be drawn from this screen.",
        }),
        ("risk_assessment", {
            "summary": "Demo mode: risk assessment was not performed. Obtain current financial, legal, operational, and compliance information before making a decision.",
            "financial_health": "Not researched",
            "credit_ratings": "Not researched",
            "operational_risks": "Not researched",
            "compliance_history": "Not researched",
            "litigation_history": "Not researched",
            "esg_risks": "Not researched",
        }),
        ("products_services", {
            "products": "Not researched",
            "services": "Not researched",
            "market_segments": "Not researched",
            "geographic_reach": location or "Not researched",
            "competitive_positioning": "Not researched",
            "summary": "Demo mode: products and services research was not performed.",
        }),
        ("claims_history", {
            "insurance_claims": "Not researched",
            "loss_records": "Not researched",
            "workplace_incidents": "Not researched",
            "product_liability": "Not researched",
            "safety_record": "Not researched",
            "summary": "Demo mode: claims and loss-history research was not performed.",
        }),
    ]

    yield f'data: {json.dumps({"type": "start", "categories": [name for name, _ in categories], "company_name": company_name, "mode": "demo"})}\n\n'
    for category, data in categories:
        yield f'data: {json.dumps({"type": "progress", "category": category, "message": "Preparing demo result (live research unavailable)..."})}\n\n'
        await asyncio.sleep(0.05)
        yield f'data: {json.dumps({"type": "category_complete", "category": category, "data": data, "sources": []})}\n\n'
    yield f'data: {json.dumps({"type": "complete", "data": {"company_name": company_name, "location": location, "mode": "demo"}, "sources": {}})}\n\n'

app = FastAPI(
    title="Insurance Underwriter Agent",
    description="AI-powered insurance underwriting research",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/underwrite/stream")
async def underwrite_stream(request: UnderwriteRequest, fastapi_request: Request):
    """Stream underwriting research results as SSE."""
    # Do not treat Vercel's deployment-bypass Authorization header as a Tavily key.
    # A client-side API key would be unsafe, so live research is server-configured only.
    configured_key = os.getenv("TAVILY_API_KEY", "").strip()
    client_key = fastapi_request.headers.get("Authorization", "").strip()
    api_key = configured_key if configured_key.startswith("tvly-") else (
        client_key if client_key.startswith("tvly-") else ""
    )

    if not api_key:
        logger.info("No Tavily API key configured; serving demo underwriting results")
        return StreamingResponse(
            demo_underwrite_stream(request.company_name, request.location),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )

    logger.info(f"Starting underwrite research for: {request.company_name} (location: {request.location})")

    return StreamingResponse(
        run_underwrite_research(
            company_name=request.company_name,
            location=request.location,
            api_key=api_key,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
