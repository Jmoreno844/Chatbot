from typing import Dict
from fastapi import WebSocket

# Store active WebSocket connections
_active_connections: Dict[str, WebSocket] = {}


def get_active_connections() -> Dict[str, WebSocket]:
    """Return active WebSocket connections."""
    return _active_connections
