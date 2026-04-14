import os
import tempfile
import logging
from dotenv import load_dotenv

# Try to load from deploy/.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "deploy", ".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_TMP_DIR = os.path.join(tempfile.gettempdir(), "yt-dlp-test")
os.makedirs(_TMP_DIR, exist_ok=True)

def test_cookie_logic():
    cookie_content = os.environ.get("YOUTUBE_COOKIES_CONTENT")
    cookie_file = os.environ.get("YOUTUBE_COOKIES_FILE")

    print(f"DEBUG: YOUTUBE_COOKIES_FILE={cookie_file}")
    print(f"DEBUG: YOUTUBE_COOKIES_CONTENT length={len(cookie_content) if cookie_content else 'None'}")
    
    if cookie_content:
        print("First line of YOUTUBE_COOKIES_CONTENT:")
        print(cookie_content.splitlines()[0] if cookie_content.splitlines() else "EMPTY")

    if cookie_content and not cookie_file:
        temp_cookies_path = os.path.join(_TMP_DIR, "cookies.txt")
        try:
            with open(temp_cookies_path, "w", encoding="utf-8") as f:
                f.write(cookie_content)
            cookie_file = temp_cookies_path
            print(f"INFO: Using YouTube cookies from YOUTUBE_COOKIES_CONTENT, wrote to {temp_cookies_path}")
        except Exception as e:
            print(f"ERROR: Failed to write YouTube cookies to temp file: {e}")

    if cookie_file and os.path.exists(cookie_file):
        print(f"INFO: Cookie file exists at {cookie_file}")
        with open(cookie_file, 'r') as f:
            lines = f.readlines()
            print(f"INFO: Cookie file has {len(lines)} lines")
        
        import yt_dlp
        video_id = "vnlWt1OGT-M"
        url = f"https://www.youtube.com/watch?v={video_id}"
        ydl_opts = {
            "skip_download": True,
            "quiet": False,
            "verbose": True,  # Enabling verbose output to see request details
            "no_warnings": False,
            "cookiefile": cookie_file,
        }
        print(f"\n--- TESTING YT-DLP WITH VIDEO: {video_id} ---")
        print(f"INFO: Using cookie file: {cookie_file}")
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # This will print a lot of info to stdout because of verbose=True
                info = ydl.extract_info(url, download=False)
                print(f"\nSUCCESS: Got metadata for '{info.get('title')}'")
                print("Cookies were successfully passed and used by yt-dlp.")
        except Exception as e:
            print(f"\nFAILURE: yt-dlp call failed.")
            print(f"Error details: {e}")
            if "Sign in to confirm you’re not a bot" in str(e):
                print("HINT: This error means YouTube detected a bot despite the cookies.")
                print("Check the logs above for 'The provided YouTube account cookies are no longer valid'.")
    else:
        print("WARNING: No valid cookie file found")

if __name__ == "__main__":
    test_cookie_logic()
