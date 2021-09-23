from typing import Any
from requests import Response

from .http_handler import HttpHandler
from .config import Environment

class TokenFactory:

    def __init__(self, http_handler: HttpHandler, debug_fn: Any = print) -> None:
        self.debug_fn = debug_fn
        self.http_handler = http_handler
        self.environment = Environment(debug_fn)

    def create(self, user_id: int, email: str) -> Response:
        return self.http_handler.send_internal_request("create-authorization-token", {"email": email, "userId": user_id})