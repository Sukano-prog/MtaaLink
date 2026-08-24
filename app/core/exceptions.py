from fastapi import HTTPException, status

class AppException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class NotFoundException(AppException):
    def __init__(self, resource: str):
        super().__init__(f"{resource} not found", status.HTTP_404_NOT_FOUND)

class AlreadyExistsException(AppException):
    def __init__(self, resource: str):
        super().__init__(f"{resource} already exists", status.HTTP_409_CONFLICT)

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Invalid credentials"):
        super().__init__(detail, status.HTTP_401_UNAUTHORIZED)

class ForbiddenException(AppException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(detail, status.HTTP_403_FORBIDDEN)

class ValidationException(AppException):
    def __init__(self, errors: list):
        super().__init__(str(errors), status.HTTP_422_UNPROCESSABLE_ENTITY)
