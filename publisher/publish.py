#!/usr/bin/env python3
"""
Eddie Vibe Marketer — Browser Use Publisher

Posts content to personal social media profiles using Browser Use
(browser automation with AI agent control).

Usage:
    python publish.py --platform linkedin --caption "Post text" [--file /path/to/media]
    python publish.py --creative '{"creative_id": "...", ...}' --platform facebook

Called from Node.js via child_process.execFile.
Outputs JSON result to stdout for the Node bridge to parse.
"""

import argparse
import asyncio
import json
import os
import sys
import time
import random

# Add parent dir to path for platform imports
sys.path.insert(0, os.path.dirname(__file__))

from platforms import facebook, linkedin, instagram, tiktok

PLATFORM_MODULES = {
    "facebook": facebook,
    "linkedin": linkedin,
    "instagram": instagram,
    "tiktok": tiktok,
}


def load_config():
    """Load publish config from the project config directory."""
    config_path = os.path.join(
        os.path.dirname(__file__), "..", "config", "publish-config.json"
    )
    if os.path.exists(config_path):
        with open(config_path) as f:
            return json.load(f)
    return {}


async def publish(platform: str, caption: str, file_path: str | None = None):
    """
    Publish content to a platform using Browser Use.

    Returns a dict: { "success": bool, "platform": str, "message": str }
    """
    config = load_config()

    # Validate platform
    if platform not in PLATFORM_MODULES:
        return {
            "success": False,
            "platform": platform,
            "message": f"Unknown platform: {platform}. Options: {list(PLATFORM_MODULES.keys())}",
        }

    # Validate file exists if provided
    if file_path and not os.path.exists(file_path):
        return {
            "success": False,
            "platform": platform,
            "message": f"File not found: {file_path}",
        }

    # Build the task prompt
    platform_module = PLATFORM_MODULES[platform]
    task = platform_module.get_task(caption, file_path)

    if task.startswith("ERROR:"):
        return {"success": False, "platform": platform, "message": task}

    # Add human-like jitter delay
    jitter = config.get("jitter_minutes", 5)
    if jitter > 0:
        delay = random.uniform(0, jitter * 60)
        # Only apply jitter if running as part of a queue (not manual single post)
        # The Node bridge can pass --no-jitter to skip this

    # Import Browser Use (only when needed — keeps startup fast for --help)
    try:
        from browser_use import Agent, Browser, BrowserConfig
        from langchain_anthropic import ChatAnthropic
    except ImportError:
        return {
            "success": False,
            "platform": platform,
            "message": "browser-use not installed. Run: pip install browser-use langchain-anthropic",
        }

    # Set up the browser with the user's Chrome profile
    chrome_profile = config.get(
        "chrome_profile_path",
        os.path.expanduser(
            "~/Library/Application Support/Google/Chrome/Default"
        ),
    )

    # Extract user data dir and profile from the path
    # Chrome profile path is typically: .../Google/Chrome/ProfileName
    chrome_dir = os.path.dirname(chrome_profile)  # .../Google/Chrome
    profile_name = os.path.basename(chrome_profile)  # Default

    browser = Browser(
        config=BrowserConfig(
            chrome_instance_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            extra_chromium_args=[
                f"--user-data-dir={chrome_dir}",
                f"--profile-directory={profile_name}",
            ],
            keep_alive=False,  # Close after posting
        )
    )

    # Create the AI agent
    llm = ChatAnthropic(
        model_name=os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-20250514"),
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        max_actions_per_step=5,
    )

    try:
        result = await agent.run(max_steps=20)

        # Check if the agent reported success
        result_text = str(result).lower() if result else ""
        success = "success" in result_text and "failed" not in result_text

        return {
            "success": success,
            "platform": platform,
            "message": str(result) if result else "Completed",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }

    except Exception as e:
        return {
            "success": False,
            "platform": platform,
            "message": f"Browser automation error: {str(e)}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }

    finally:
        try:
            await browser.close()
        except Exception:
            pass


def main():
    parser = argparse.ArgumentParser(description="Eddie Publisher — post to social media")
    parser.add_argument("--platform", required=True, help="Platform: facebook, linkedin, instagram, tiktok")
    parser.add_argument("--caption", help="Post text/caption")
    parser.add_argument("--file", help="Path to media file (image or video)")
    parser.add_argument("--creative", help="JSON string of creative object (alternative to --caption/--file)")

    args = parser.parse_args()

    # Parse creative JSON if provided
    if args.creative:
        creative = json.loads(args.creative)
        caption = creative.get("content") or creative.get("caption") or ""
        file_path = creative.get("file_path")
    else:
        caption = args.caption or ""
        file_path = args.file

    if not caption and not file_path:
        print(json.dumps({"success": False, "message": "No caption or file provided"}))
        sys.exit(1)

    # Run the publisher
    result = asyncio.run(publish(args.platform, caption, file_path))
    print(json.dumps(result))

    sys.exit(0 if result.get("success") else 1)


if __name__ == "__main__":
    main()
