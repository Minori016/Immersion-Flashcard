import yt_dlp
import json
import os

PLAYLIST_URL = "https://youtube.com/playlist?list=PLQcOOIxIw8dIZFPPnHzSBoCFXVPqBhYjP"

def generate_metadata():
    ydl_opts = {
        'extract_flat': True,
        'quiet': True
    }
    print("Fetching titles from playlist...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(PLAYLIST_URL, download=False)
        metadata = {}
        for entry in result['entries']:
            video_id = entry.get('id')
            title = entry.get('title', f"Video {video_id}")
            # Clean up title: usually "Japanese Podcast #123 - ..."
            # We can strip common prefixes if needed
            metadata[video_id] = title
        
        with open("video_metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
    print("Done! Saved video_metadata.json")

if __name__ == "__main__":
    generate_metadata()
