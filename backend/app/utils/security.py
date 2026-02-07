from pathlib import Path


def validate_path(path: str | Path, base_dir: str | Path) -> Path:
    """
    Validate that a path is within a base directory.
    Returns the absolute path if valid, raises ValueError if not.
    """
    try:
        # Resolve absolute paths
        abs_base = Path(base_dir).resolve()
        abs_path = Path(path).resolve()

        # Check that the resolved path starts with the base directory
        if not str(abs_path).startswith(str(abs_base)):
            raise ValueError(
                f"Path traversal detected: {path} is not within {base_dir}"
            )

        return abs_path
    except Exception as e:
        raise ValueError(f"Invalid path: {e}")


def safe_path_join(base_dir: str | Path, *paths: str) -> Path:
    """
    Safely join paths and ensure the result is within the base directory.
    """
    # bearer:disable python_lang_path_traversal
    full_path = Path(base_dir).joinpath(*paths)
    return validate_path(full_path, base_dir)
