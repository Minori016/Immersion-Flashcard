import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
import json
import os
import time
import random
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import logging

# --- Configuration ---
PLAYLIST_URL = "https://youtube.com/playlist?list=PLQcOOIxIw8dIZFPPnHzSBoCFXVPqBhYjP"
OUTPUT_DIR = "raw_transcripts"
DATASET_FILE = "dataset.json"
MAX_WORKERS = 1  # Chạy tuần tự 1 video duy nhất tại một điểm để an toàn tuyệt đối
RETRY_COUNT = 3

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("Fetcher4G")

# --- Global State ---
class GlobalState:
    def __init__(self):
        self.lock = Lock()
        self.success_count = 0
        self.fail_count = 0
        self.skip_count = 0

state = None

# --- Custom Session ---
def make_session():
    # Sử dụng Chrome trên Windows để giả lập máy tính để bàn
    s = requests.Session()
    s.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com/',
    })
    return s

# --- Playlist Fetching ---
def get_video_ids(playlist_url):
    opts = {'extract_flat': True, 'quiet': True, 'no_warnings': True}

    logger.info(f"Extracting video IDs from: {playlist_url}")
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            result = ydl.extract_info(playlist_url, download=False)
            entries = [e for e in result.get('entries', []) 
                      if e and e.get('id') and 'private' not in e.get('title', '').lower() 
                      and 'deleted' not in e.get('title', '').lower()]
            
            return [e['id'] for e in entries]
    except Exception as e:
        logger.error(f"Failed to fetch playlist: {e}")
        return []

# --- Core Task ---
def process_video(vid, index, total):
    path = os.path.join(OUTPUT_DIR, f"{vid}.json")
    
    if os.path.exists(path):
        with state.lock:
            state.skip_count += 1
        return f"SKIP: {vid}"

    # Nghỉ cực dài (15-40s) giữa các video để YouTube không nghi ngờ
    time.sleep(random.uniform(15, 40))

    for attempt in range(RETRY_COUNT):
        try:
            session = make_session()
            api = YouTubeTranscriptApi(http_client=session)
            
            # Fetching Japanese transcript
            data = api.fetch(vid, languages=['ja'])
            
            result = [
                {
                    "video_id": vid, 
                    "start_time": round(l.start, 2),
                    "duration": round(l.duration, 2), 
                    "text_raw": l.text.replace('\n', ' ')
                } for l in data
            ]
            
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            with state.lock:
                state.success_count += 1
            return f"SUCCESS: {vid} ({len(result)} lines)"

        except Exception as e:
            err_msg = str(e).lower()
            # Lỗi không có sub hoặc video bị chặn (không cần retry)
            if any(k in err_msg for k in ("no transcript", "unavailable", "private", "disabled")):
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump([], f)
                with state.lock:
                    state.fail_count += 1
                return f"UNAVAILABLE: {vid} - {e}"
            
            # Lỗi liên quan đến mạng / IP bị block tạm thời (retry)
            wait_time = random.uniform(60, 180) * (attempt + 1)
            logger.warning(f"Attempt {attempt+1} failed for {vid}. Nghỉ xả hơi {wait_time:.1f}s trước khi thử lại...")
            time.sleep(wait_time)

    # Ghi log thất bại hoàn toàn sau RETRY_COUNT lần
    with open(path, 'w', encoding='utf-8') as f:
        json.dump([], f)
    with state.lock:
        state.fail_count += 1
    return f"FAILED: {vid} after {RETRY_COUNT} attempts"

# --- Main Logic ---
def main():
    global state
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    state = GlobalState()
    
    video_ids = get_video_ids(PLAYLIST_URL)
    total = len(video_ids)
    
    if not video_ids:
        logger.error("No videos found in playlist. Exiting.")
        return

    logger.info(f"Starting Fetcher (Direct 4G Mode) for {total} videos...")
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # submit task vào pool
        future_to_vid = {executor.submit(process_video, vid, i, total): vid for i, vid in enumerate(video_ids)}
        
        for future in as_completed(future_to_vid):
            res = future.result()
            # Print tiến trình
            if "SUCCESS" in res:
                print(f"\r[Progress] {state.success_count + state.fail_count + state.skip_count}/{total} | {res}          ", end="")
            elif "SKIP" not in res:
                logger.info(res)

    print("\n" + "="*50)
    logger.info(f"Finished! Success: {state.success_count}, Failed: {state.fail_count}, Skipped: {state.skip_count}")

    # Merge vào dataset.json
    logger.info("Merging transcripts into dataset.json...")
    dataset = []
    # Duyệt file theo thứ tự playlist
    for vid in video_ids:
        path = os.path.join(OUTPUT_DIR, f"{vid}.json")
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = json.load(f)
                if content:
                    dataset.extend(content)
    
    with open(DATASET_FILE, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Dataset generated with {len(dataset)} transcript lines.")

if __name__ == "__main__":
    main()

