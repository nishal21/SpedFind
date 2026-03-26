import time
import os
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import json

app = FastAPI(title="SpedFind API", description="Pro-Grade Speed Test Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/config")
async def get_config(request: Request):
    # Fetch ISP info asynchronously for true accuracy
    client_ip = request.headers.get("x-forwarded-for") or request.client.host
    isp_info = {"isp": "Unknown", "city": "Unknown", "country": "Unknown"}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"http://ip-api.com/json/{client_ip}", timeout=2.0)
            if res.status_code == 200:
                data = res.json()
                isp_info = {
                    "isp": data.get("isp", "Unknown"),
                    "city": data.get("city", "Unknown"),
                    "country": data.get("country", "Unknown")
                }
    except Exception:
        pass

    return {
        "success": True,
        "data": {
            "server": {"name": "SpedFind Global Node (FastAPI)", "location": "Local"},
            "client": {"ip": client_ip, **isp_info},
            "timestamp": time.time()
        }
    }

@app.get("/api/download")
async def download(size: int = 25000000): # Default 25MB
    max_size = min(size, 100000000) # Max 100MB cap
    chunk_size = 1024 * 64 # 64KB chunks
    
    async def data_streamer():
        bytes_sent = 0
        random_chunk = os.urandom(chunk_size)
        while bytes_sent < max_size:
            send_size = min(chunk_size, max_size - bytes_sent)
            yield random_chunk[:send_size]
            bytes_sent += send_size
            await asyncio.sleep(0.001) # Critical: yields control to the event loop to process pings
            
    return StreamingResponse(
        data_streamer(), 
        media_type="application/octet-stream",
        headers={"Content-Length": str(max_size)}
    )

@app.post("/api/upload")
async def upload(request: Request):
    start_time = time.time()
    bytes_received = 0
    
    # Read streaming data directly to calculate true upload speed
    async for chunk in request.stream():
        bytes_received += len(chunk)
        await asyncio.sleep(0.001)
        
    end_time = time.time()
    duration = end_time - start_time
    mbps = (bytes_received * 8) / (duration * 1000000) if duration > 0 else 0
    
    return {
        "success": True,
        "data": {
            "bytes_received": bytes_received,
            "duration_seconds": duration,
            "calculated_mbps": mbps
        }
    }
