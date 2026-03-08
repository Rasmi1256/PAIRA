"""
app/redis/keys.py

Centralized Redis key definitions.

WHY THIS FILE EXISTS:
- Prevents hardcoded Redis keys across the codebase
- Makes refactoring safe
- Keeps Redis namespace predictable
"""

# ---------------------------------------------------------
# PRESENCE KEYS
# ---------------------------------------------------------

def presence_key(user_id: int) -> str:
    """
    Redis key for user presence.

    Example:
    presence:user:42
    """
    return f"presence:user:{user_id}"


# ---------------------------------------------------------
# FUTURE KEYS (PLACEHOLDERS)
# ---------------------------------------------------------
# These will be useful later for scaling.
# ---------------------------------------------------------

def active_call_key(call_id: str) -> str:
    """
    Redis key for tracking active calls.

    Example:
    video_call:active:<uuid>
    """
    return f"video_call:active:{call_id}"


def user_call_lock_key(user_id: int) -> str:
    """
    Redis key to prevent parallel calls for a user.

    Example:
    video_call:lock:user:42
    """
    return f"video_call:lock:user:{user_id}"
