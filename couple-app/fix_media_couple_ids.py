#!/usr/bin/env python3
"""
Script to fix existing media records that don't have couple_id set.
This ensures all uploaded media is properly associated with couples.
"""

from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.db.base import Base
from sqlalchemy import create_engine
from app.models.media import Media
from app.models.user import User

def main():
    # Create engine and session
    engine = create_engine(settings.DATABASE_URL, future=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    session = SessionLocal()
    try:
        # Find media records without couple_id
        media_without_couple = session.query(Media).filter(Media.couple_id.is_(None)).all()
        print(f'Found {len(media_without_couple)} media records without couple_id')

        if media_without_couple:
            print('Updating existing media records...')
            updated_count = 0

            for media in media_without_couple:
                # Get the user who uploaded this media
                user = session.query(User).filter(User.id == media.user_id).first()
                if user and user.couple_id:
                    media.couple_id = user.couple_id
                    updated_count += 1
                    print(f'Updated media {media.id} with couple_id {user.couple_id}')
                else:
                    print(f'Warning: Could not find couple_id for user {media.user_id} (media {media.id})')

            session.commit()
            print(f'Successfully updated {updated_count} media records!')
        else:
            print('All media records already have couple_id set.')

    except Exception as e:
        print(f'Error: {e}')
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()
