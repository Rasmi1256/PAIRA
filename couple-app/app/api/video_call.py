from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.video_call import VideoCall
from app.schemas.video_call import VideoCallCreate, VideoCallUpdateStatus, VideoCallResponse
from app.models.couple import Couple
from app.models.user import User

ALLOWED_TRANSITIONS = {
    'ringing': {'active','rejected', 'missed'},
    'active': {'ended'},
    'rejected': set(),
    'ended': set(),
    'missed': set()
}

class VideoCallService:

    @staticmethod
    def _ensure_same_couple(
        db : Session,
        user_a_id : int,
        user_b_id : int,
    ) -> None:
        
        couple = db.query(Couple).filter( 
            (
                (Couple.user1_id == user_a_id) & (Couple.user2_id == user_b_id)
            ) | (
                (Couple.user1_id == user_b_id) & (Couple.user2_id == user_a_id)
            )
        ).first()
        if not couple:
            raise ValueError("Users are not part of the same couple.")
        
    @staticmethod
    def initiate_call(
        db: Session,
        caller: User,
        callee_id: int,
    ) -> VideoCall:
        """
        Creates a new video call in 'ringing' state.

        Called when a user initiates a call.
        """

        # Ensure users belong to the same couple
        VideoCallService._ensure_same_couple(
            db,
            caller.id,
            callee_id,
        )

        call = VideoCall(
            caller_id=caller.id,
            callee_id=callee_id,
            status="ringing",
            created_at=datetime.utcnow(),
        )

        db.add(call)
        db.commit()
        db.refresh(call)

        return call

    @staticmethod
    def accept_call(
        db: Session,
        call_id: UUID,
        user: User,
    ) -> VideoCall:
        """
        Accepts a ringing call and moves it to 'active'.
        """

        call = db.query(VideoCall).filter(VideoCall.id == call_id).first()

        if not call:
            raise ValueError("Call not found")

        if call.callee_id != user.id:
            raise ValueError("Only the callee can accept the call")

        VideoCallService._transition_call(
            db=db,
            call=call,
            new_status="active",
        )

        call.started_at = datetime.utcnow()
        db.commit()
        db.refresh(call)

        return call
    
    @staticmethod
    def reject_call(
        db: Session,
        call_id: UUID,
        user: User,
    ) -> VideoCall:
        """
        Rejects a ringing call.
        """

        call = db.query(VideoCall).filter(VideoCall.id == call_id).first()

        if not call:
            raise ValueError("Call not found")

        if call.callee_id != user.id:
            raise ValueError("Only the callee can reject the call")

        VideoCallService._transition_call(
            db=db,
            call=call,
            new_status="rejected",
        )

        call.ended_at = datetime.utcnow()
        db.commit()
        db.refresh(call)

        return call
    
    @staticmethod
    def end_call(
        db: Session,
        call_id: UUID,
        user: User,
    ) -> VideoCall:
        """
        Ends an active call.

        Either caller or callee can end the call.
        """

        call = db.query(VideoCall).filter(VideoCall.id == call_id).first()

        if not call:
            raise ValueError("Call not found")

        if user.id not in {call.caller_id, call.callee_id}:
            raise ValueError("User is not part of this call")

        VideoCallService._transition_call(
            db=db,
            call=call,
            new_status="ended",
        )

        call.ended_at = datetime.utcnow()
        db.commit()
        db.refresh(call)

        return call
    @staticmethod
    def _transition_call(
        db: Session,
        call: VideoCall,
        new_status: str,
    ) -> None:
        """
        Validates and applies a call state transition.
        """

        allowed = ALLOWED_TRANSITIONS.get(call.status, set())

        if new_status not in allowed:
            raise ValueError(
                f"Invalid call state transition: "
                f"{call.status} -> {new_status}"
            )

        call.status = new_status

