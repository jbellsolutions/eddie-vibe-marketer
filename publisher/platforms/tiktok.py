"""TikTok publisher via Browser Use (web upload)."""


def get_task(caption: str, file_path: str | None = None) -> str:
    """Build the Browser Use task prompt for TikTok posting."""
    if not file_path:
        return "ERROR: TikTok requires a video to post. No file_path provided."

    if not file_path.endswith(('.mp4', '.mov', '.avi', '.webm')):
        return "ERROR: TikTok requires a video file (.mp4, .mov, .avi, .webm)."

    task = (
        "Go to tiktok.com/upload. Wait for the page to load.\n"
        f"Upload the video file at: {file_path}\n"
        "Wait for the upload and processing to complete.\n"
        f"In the caption/description field, type:\n\n{caption}\n\n"
        "Make sure 'Everyone' is selected for who can view.\n"
        "Click the 'Post' button.\n"
        "Wait for confirmation that the video was posted.\n"
        "Output: SUCCESS or FAILED with reason."
    )
    return task
