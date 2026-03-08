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
from app.models.calendar import CalendarEvent
from app.models.gallery import Album, Tag
from app.models.pairing import PairingCode
from app.models.journal import JournalEntry, JournalAttachment
from app.models.video_call import VideoCall

