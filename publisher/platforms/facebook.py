"""Facebook personal profile publisher via Browser Use."""


def get_task(caption: str, file_path: str | None = None) -> str:
    """Build the Browser Use task prompt for Facebook posting."""
    task = (
        "Go to facebook.com. Wait for the page to load.\n"
        "Click on the 'What's on your mind?' box or 'Create post' area.\n"
        f"Type this text (exactly as written):\n\n{caption}\n\n"
    )

    if file_path:
        task += (
            f"Click the photo/video button to add media.\n"
            f"Upload the file at this path: {file_path}\n"
            "Wait for the upload to complete.\n"
        )

    task += (
        "Click the 'Post' button.\n"
        "Wait for the post to appear in your feed.\n"
        "Confirm the post was published successfully.\n"
        "Output: SUCCESS or FAILED with reason."
    )
    return task
