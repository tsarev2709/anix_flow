import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def connect():
    root = Path(os.getenv("FLOW_DATA_DIR", Path(__file__).parents[1] / ".flow-data"))
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    db = sqlite3.connect(root / "projects.sqlite3")
    db.execute("CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, updated TEXT NOT NULL, data TEXT NOT NULL)")
    return db


def save(id_: str, data: dict):
    updated = datetime.now(timezone.utc).isoformat()
    with connect() as db:
        db.execute("INSERT INTO projects VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated, data=excluded.data",
                   (id_, updated, json.dumps(data, ensure_ascii=False)))
    return updated


def load_all():
    with connect() as db:
        return [{"id": row[0], "updated": row[1], "data": json.loads(row[2])}
                for row in db.execute("SELECT id, updated, data FROM projects ORDER BY updated DESC")]
