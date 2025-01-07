from time import time
from typing import Any, Dict, Tuple

from ordered_set import OrderedSet

from .exceptions import AuthenticateException
from .http_handler import HttpHandler
from .message_bus import MessageBus


class Session:
    id: str
    timestamp: int

    def __init__(self, id: str, timestamp: int = 0) -> None:
        self.id = id
        self.timestamp = timestamp

    def __eq__(self, other):
        return isinstance(other, Session) and self.id == other.id

    def __hash__(self):
        return hash(self.id)


class SessionHandler:
    LOGOUT_TOPIC = "logout"
    PRUNE_TIME = int(600 * 1.1)

    invalid_sessions: OrderedSet[Session]

    def __init__(self, debug_fn: Any = print) -> None:
        self.debug_fn = debug_fn
        self.http_handler = HttpHandler(debug_fn)
        self.message_bus = MessageBus(debug_fn)
        self.invalid_sessions = OrderedSet()

    def update_invalid_sessions(self) -> None:
        if len(self.invalid_sessions):
            index = len(self.invalid_sessions) // 2
            median = self.invalid_sessions[index]
            if median.timestamp / 1000 < time() - self.PRUNE_TIME:
                self.invalid_sessions = self.invalid_sessions[index + 1 :]
        new_logouts = self.message_bus.xread(self.LOGOUT_TOPIC, self.PRUNE_TIME)
        self.invalid_sessions.update(
            [self.create_session(logout) for logout in new_logouts]
        )

    def create_session(self, logout_data: Tuple[bytes, Dict[bytes, bytes]]) -> Session:
        timestamp = int(logout_data[0].decode().split("-")[0])
        session_id = logout_data[1][b"sessionId"].decode()
        return Session(session_id, timestamp)

    def is_session_invalid(self, session_id: str) -> bool:
        self.update_invalid_sessions()
        return Session(session_id) in self.invalid_sessions

    def clear_all_sessions(self, token: str, cookie: str) -> None:
        response = self.http_handler.send_secure_request(
            "clear-all-sessions", token, cookie
        )
        if response.status_code != 200:
            raise AuthenticateException("Failed to clear all sessions")

    def clear_sessions_by_user_id(self, user_id: int) -> None:
        response = self.http_handler.send_internal_request(
            "clear-sessions-by-user-id", {"userId": user_id}
        )
        if response.status_code != 200:
            raise AuthenticateException(
                f"Failed to clear all sessions of user {user_id}."
            )
