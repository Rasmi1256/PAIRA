from typing import Dict
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.user import User

class PresenceManager:
    def __init__(self):
        self.online_users: Dict[int, int] = {}  # user_id -> websocket connection count

    def user_connected(self, user_id: int):
        self.online_users[user_id] = self.online_users.get(user_id, 0) + 1

    def user_disconnected(self, user_id: int):
        if user_id in self.online_users:
            self.online_users[user_id] -= 1
            if self.online_users[user_id] <= 0:
                self.online_users.pop(user_id, None)
                return True  # became offline
        return False

    def is_online(self, user_id: int) -> bool:
        return user_id in self.online_users

    def update_last_seen(self, db: Session, user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.last_seen = func.now()
            db.commit()
            db.refresh(user)
            return user.last_seen
        return None


presence_manager = PresenceManager()
