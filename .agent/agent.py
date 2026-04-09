#!/usr/bin/env python3
"""
Eddie Vibe Marketer — Level 2 Persistent Agent

Reads identity.json for project context, maintains state.json across sessions.
Can be extended to run health checks, trigger cycles, or monitor performance.
"""

import json
import os
from pathlib import Path
from datetime import datetime

PROJECT_NAME = "eddie-vibe-marketer"
REPO_PATH = os.environ.get("REPO_PATH", str(Path(__file__).resolve().parent.parent))
AGENT_DIR = Path(__file__).parent
IDENTITY_PATH = AGENT_DIR / "identity.json"
STATE_PATH = AGENT_DIR / "state.json"


def load_identity():
    with open(IDENTITY_PATH) as f:
        return json.load(f)


def load_state():
    with open(STATE_PATH) as f:
        return json.load(f)


def save_state(state):
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)


def health_check():
    """Basic health check — verify key files and directories exist."""
    identity = load_identity()
    issues = []

    for entry in identity["entry_points"]:
        full_path = Path(REPO_PATH) / entry
        if not full_path.exists():
            issues.append(f"Missing entry point: {entry}")

    env_path = Path(REPO_PATH) / ".env"
    if not env_path.exists():
        issues.append("Missing .env file — run: cp config/.env.example .env")

    node_modules = Path(REPO_PATH) / "node_modules"
    if not node_modules.exists():
        issues.append("Missing node_modules — run: npm install")

    return issues


def main():
    identity = load_identity()
    state = load_state()

    print(f"[{PROJECT_NAME}] Level 2 Agent — Session Start")
    print(f"  Version: {identity['version']}")
    print(f"  Sessions: {state['session_count']}")

    # Update state
    state["session_count"] += 1
    state["last_session"] = datetime.now().isoformat()

    # Health check
    issues = health_check()
    if issues:
        state["health_status"] = "degraded"
        state["known_issues"] = issues
        print(f"  Health: DEGRADED ({len(issues)} issues)")
        for issue in issues:
            print(f"    - {issue}")
    else:
        state["health_status"] = "healthy"
        state["known_issues"] = []
        print("  Health: OK")

    save_state(state)


if __name__ == "__main__":
    main()
