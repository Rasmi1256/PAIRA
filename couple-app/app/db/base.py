# ensure models are imported for Alembic autogenerate

from app.models.user import User
from app.models.conversation import Conversation
from app.models.couple import Couple
from app.models.invite import CoupleInvite
from app.models.magic_link import MagicLink
from app.models.webauthn_credential import WebAuthnCredential

# Chat models
from app.chat.models import ChatConversation, Message


from app.models.media import Media

