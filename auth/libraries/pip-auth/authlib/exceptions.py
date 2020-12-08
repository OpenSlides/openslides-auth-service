class BaseException(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class InvalidCredentialsException(BaseException):
    def __init__(self, message: str) -> None:
        super().__init__(f"The credentials are not valid. Reason: {message}")


class AuthenticateException(BaseException):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class KeyException(BaseException):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class InstanceError(BaseException):
    def __init__(self, message: str) -> None:
        super().__init__(message)
