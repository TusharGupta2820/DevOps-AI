from app.utils.logger import get_logger

class BaseService:
    def __init__(self) -> None:
        self.logger = get_logger(self.__class__.__name__)
