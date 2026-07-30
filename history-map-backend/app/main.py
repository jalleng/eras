from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.neo4j_driver import close_driver
from app.routers import events, locations, polities

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    close_driver()


app = FastAPI(title="Eras History Map API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(events.router)
app.include_router(locations.router)
app.include_router(polities.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
