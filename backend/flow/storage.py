import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


class ConflictError(Exception):
    def __init__(self, revision: int):
        self.revision = revision
        super().__init__(f"Копия уже имеет ревизию {revision}. Эта запись устарела. Сохрани отдельную копию или восстанови актуальную; изменения не перезаписаны.")


def connect():
    root = Path(os.getenv("FLOW_DATA_DIR", Path(__file__).parents[1] / ".flow-data"))
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    db = sqlite3.connect(root / "projects.sqlite3", timeout=10)
    db.execute("PRAGMA busy_timeout=10000")
    # Serialize schema upgrade as well as writes; old databases keep their existing data.
    try:
        db.execute("BEGIN IMMEDIATE")
        db.execute("CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, updated TEXT NOT NULL, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1)")
        columns = {row[1] for row in db.execute("PRAGMA table_info(projects)")}
        if "revision" not in columns:
            db.execute("ALTER TABLE projects ADD COLUMN revision INTEGER NOT NULL DEFAULT 1")
        db.execute("CREATE TABLE IF NOT EXISTS project_revisions (project_id TEXT NOT NULL, revision INTEGER NOT NULL, updated TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(project_id, revision))")
        db.execute("INSERT OR IGNORE INTO project_revisions SELECT id, revision, updated, data FROM projects")
        db.commit()
    except Exception:
        db.rollback()
        db.close()
        raise
    return db


def save(id_: str, data: dict, expected_revision: int | None = None):
    updated = datetime.now(timezone.utc).isoformat()
    encoded = json.dumps(data, ensure_ascii=False)
    db = connect()
    try:
        db.execute("BEGIN IMMEDIATE")
        row = db.execute("SELECT revision FROM projects WHERE id=?", (id_,)).fetchone()
        current = row[0] if row else 0
        if (row and expected_revision != current) or (not row and expected_revision not in (None, 0)):
            raise ConflictError(current)
        revision = current + 1
        db.execute("INSERT INTO projects (id, updated, data, revision) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated, data=excluded.data, revision=excluded.revision",
                   (id_, updated, encoded, revision))
        db.execute("INSERT INTO project_revisions VALUES (?, ?, ?, ?)", (id_, revision, updated, encoded))
        db.commit()
        return {"updated": updated, "revision": revision}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def load_all():
    db = connect()
    try:
        return [{"id": row[0], "updated": row[1], "data": json.loads(row[2]), "revision": row[3]}
                for row in db.execute("SELECT id, updated, data, revision FROM projects ORDER BY updated DESC")]
    finally:
        db.close()


def revisions(id_: str):
    db = connect()
    try:
        return [{"revision": row[0], "updated": row[1], "data": json.loads(row[2])}
                for row in db.execute("SELECT revision, updated, data FROM project_revisions WHERE project_id=? ORDER BY revision DESC LIMIT 20", (id_,))]
    finally:
        db.close()
