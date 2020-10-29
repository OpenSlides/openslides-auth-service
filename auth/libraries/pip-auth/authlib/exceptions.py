class InvalidCredentialsException(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"The credentials are not valid. Reason: {message}")


class AuthenticateException(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
