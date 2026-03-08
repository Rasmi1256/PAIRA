#!/usr/bin/env python3
"""
Script to convert existing WAV voice messages to MP3 format for better browser compatibility.
"""

import os
import tempfile
from pathlib import Path

from pydub import AudioSegment
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.core.gcs import GCSClient
from app.db.session import engine
from app.models.voice_message import VoiceMessage


def convert_wav_to_mp3(wav_path: str, mp3_path: str) -> bool:
    """Convert WAV file to MP3 format."""
    try:
        # Load WAV file
        audio = AudioSegment.from_wav(wav_path)

        # Export as MP3
        audio.export(mp3_path, format="mp3", bitrate="128k")
        return True
    except Exception as e:
        print(f"Error converting {wav_path} to MP3: {e}")
        return False


def main():
    """Main conversion function."""
    print("Starting voice message conversion from WAV to MP3...")

    # Create database session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Initialize GCS client
    gcs_client = GCSClient()

    try:
        # Get all voice messages
        voice_messages = db.query(VoiceMessage).all()
        print(f"Found {len(voice_messages)} voice messages to check")

        converted_count = 0

        for vm in voice_messages:
            # Check if it's a WAV file (by checking the path or trying to download)
            if not vm.audio_path.endswith('.wav'):
                continue

            print(f"Converting voice message {vm.id}: {vm.audio_path}")

            # Create temporary files
            with tempfile.TemporaryDirectory() as temp_dir:
                wav_temp_path = os.path.join(temp_dir, f"temp_{vm.id}.wav")
                mp3_temp_path = os.path.join(temp_dir, f"temp_{vm.id}.mp3")

                try:
                    # Download WAV file from GCS
                    gcs_client.download_file(vm.audio_path, wav_temp_path)

                    # Convert to MP3
                    if convert_wav_to_mp3(wav_temp_path, mp3_temp_path):
                        # Generate new path for MP3 file
                        new_path = vm.audio_path.replace('.wav', '.mp3')

                        # Upload MP3 file to GCS
                        gcs_client.upload_file(mp3_temp_path, new_path)

                        # Update database
                        vm.audio_path = new_path
                        db.commit()

                        # Optionally delete old WAV file
                        try:
                            gcs_client.delete_file(vm.audio_path.replace('.mp3', '.wav'))
                        except Exception as e:
                            print(f"Warning: Could not delete old WAV file: {e}")

                        converted_count += 1
                        print(f"Successfully converted voice message {vm.id}")

                except Exception as e:
                    print(f"Error processing voice message {vm.id}: {e}")
                    db.rollback()
                    continue

        print(f"Conversion complete! Converted {converted_count} voice messages.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
