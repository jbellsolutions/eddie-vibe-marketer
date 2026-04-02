"""Instagram publisher via Browser Use (web interface)."""


def get_task(caption: str, file_path: str | None = None) -> str:
    """Build the Browser Use task prompt for Instagram posting."""
    if not file_path:
        return "ERROR: Instagram requires an image or video to post. No file_path provided."

    task = (
        "Go to instagram.com. Wait for the page to load.\n"
        "Click the '+' (create) button in the navigation bar.\n"
        f"Upload the file at: {file_path}\n"
        "Wait for the upload to complete.\n"
        "If prompted to crop or adjust, click 'Next' or 'Continue'.\n"
        "Click 'Next' to get to the caption screen.\n"
        f"Type this caption (exactly as written):\n\n{caption}\n\n"
        "Click 'Share' to publish.\n"
        "Wait for the post to appear.\n"
        "Confirm the post was published successfully.\n"
        "Output: SUCCESS or FAILED with reason."
    )
    return task
