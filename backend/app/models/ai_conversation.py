from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Boolean, CheckConstraint, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimeStampedModel, ProductionAuditModel

if TYPE_CHECKING:
    from app.models.user import User


class AIConversation(ProductionAuditModel):
    __tablename__ = "ai_conversations"

    title: Mapped[str] = mapped_column(String(255), nullable=False, default="New AI DevOps Investigation")
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    model_used: Mapped[str] = mapped_column(String(100), default="gemini-2.5-flash", nullable=False)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="ai_conversations")
    messages: Mapped[List["AIMessage"]] = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")


class AIMessage(TimeStampedModel):
    __tablename__ = "ai_messages"
    __table_args__ = (
        CheckConstraint("sender IN ('USER', 'ASSISTANT', 'SYSTEM')", name="ck_ai_messages_sender_valid"),
    )

    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    sender: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_action: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=320)

    # Relationship
    conversation: Mapped["AIConversation"] = relationship("AIConversation", back_populates="messages")
