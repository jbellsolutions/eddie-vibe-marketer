"""LinkedIn personal profile publisher via Browser Use."""


def get_task(caption: str, file_path: str | None = None) -> str:
    """Build the Browser Use task prompt for LinkedIn posting."""
    task = (
        "Go to linkedin.com/feed. Wait for the page to load.\n"
        "Click 'Start a post' button.\n"
        f"Type this text (exactly as written, preserving line breaks):\n\n{caption}\n\n"
    )

    if file_path:
        if file_path.endswith(('.mp4', '.mov', '.avi', '.webm')):
            task += (
                "Click the video icon to add a video.\n"
                f"Upload the video file at: {file_path}\n"
            )
        elif file_path.endswith(('.png', '.jpg', '.jpeg', '.gif')):
            task += (
                "Click the image icon to add a photo.\n"
                f"Upload the image file at: {file_path}\n"
            )
        else:
            task += (
                "Click the document icon to add a document.\n"
                f"Upload the file at: {file_path}\n"
            )
        task += "Wait for the upload to complete.\n"

    task += (
        "Click the 'Post' button.\n"
        "Wait for the post to appear in the feed.\n"
        "Confirm the post was published successfully.\n"
        "Output: SUCCESS or FAILED with reason."
    )
    return task
