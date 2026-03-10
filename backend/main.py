import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.coach import router

app = FastAPI(title="Chess Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

app.include_router(router)
