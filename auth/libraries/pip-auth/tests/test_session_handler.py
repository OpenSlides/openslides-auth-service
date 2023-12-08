from time import time

from authlib.session_handler import Session, SessionHandler

from .base import BaseTestEnvironment


class TestSessionHandler(BaseTestEnvironment):
    def setUp(self) -> None:
        super().setUp()
        self.session_handler = SessionHandler()

    def test_session_handler(self) -> None:
        self.session_handler.update_invalid_sessions()
        self.assertEqual(len(self.session_handler.invalid_sessions), 0)
        session_ids = ["1", "2", "3"]
        for session_id in session_ids:
            self.message_bus.redis.xadd("logout", {"sessionId": session_id})
        self.session_handler.update_invalid_sessions()
        self.assertEqual(len(self.session_handler.invalid_sessions), 3)
        for session_id in session_ids:
            self.assertTrue(self.session_handler.is_session_invalid(session_id))
        self.assertFalse(self.session_handler.is_session_invalid("4"))
        self.session_handler.update_invalid_sessions()
        self.assertEqual(len(self.session_handler.invalid_sessions), 3)

    def test_expiry_odd(self) -> None:
        self.session_handler.invalid_sessions.add(Session("1", 0))
        self.session_handler.invalid_sessions.add(Session("2", 0))
        self.session_handler.invalid_sessions.add(Session("3", int(time() * 1000)))
        self.session_handler.update_invalid_sessions()
        self.assertEqual(len(self.session_handler.invalid_sessions), 1)

    def test_expiry_even(self) -> None:
        self.session_handler.invalid_sessions.add(Session("1", 0))
        self.session_handler.invalid_sessions.add(Session("2", 0))
        self.session_handler.invalid_sessions.add(Session("3", 0))
        self.session_handler.invalid_sessions.add(Session("4", int(time() * 1000)))
        self.session_handler.update_invalid_sessions()
        self.assertEqual(len(self.session_handler.invalid_sessions), 1)
