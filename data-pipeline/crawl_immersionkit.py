import requests
import json
import os
import time
import random
import logging

# --- Configuration ---
API_BASE = "https://apiv2.immersionkit.com/search"
OUTPUT_DIR = "immersion_kit_data"
# Slugs gathered from images provided by user
TITLES = ["your_lie_in_april"]

# Common characters to search for to exhaust the data
SEARCH_QUERIES = ["。", "！", "？"]

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("ImmersionKitCrawler")

def crawl():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for title in TITLES:
        title_data = []
        seen_ids = set()
        logger.info(f"Processing title: {title}")
        
        for q in SEARCH_QUERIES:
            try:
                params = {
                    "q": q,
                    "index": title,
                    "limit": 1000
                }
                resp = requests.get(API_BASE, params=params, timeout=30)
                resp.raise_for_status()
                
                data = resp.json()
                examples = []
                if "data" in data and len(data["data"]) > 0:
                    examples = data["data"][0].get("examples", [])
                    for ex in examples:
                        ex_id = ex.get("id")
                        if ex_id not in seen_ids:
                            seen_ids.add(ex_id)
                            title_data.append(ex)
                
                logger.info(f"  Query '{q}' found {len(examples)} examples. Total for {title}: {len(title_data)}")
                time.sleep(random.uniform(0.5, 1.5))
                
            except Exception as e:
                logger.error(f"  Error querying '{q}' for {title}: {str(e)}")

        # Save to file
        output_file = os.path.join(OUTPUT_DIR, f"{title}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(title_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Finished {title}. Saved {len(title_data)} examples.")

if __name__ == "__main__":
    crawl()
