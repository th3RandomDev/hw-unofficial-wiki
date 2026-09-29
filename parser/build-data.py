import os
import json
import re
import io
from PIL import Image
import openpyxl
from openpyxl_image_loader import SheetImageLoader

# Configuration
EXCEL_FILE = "HORIZON WALKER WIKI (UNOFFICIAL).xlsx"
OUTPUT_DATA_FILE = "site_data.json"
IMAGE_DIR = "images"

RARITY_SHEETS = ['EX Units', 'SS Units', 'S Units', 'A Units']

# Known name discrepancies across tabs
NAME_ALIASES = {
    "matrotho": "Martrotho",
    "yui": "Yui Matsumoto",
    "yeon chae-young": "Yeon Chaeyoung",
    "yeon chae young": "Yeon Chaeyoung",
}

def normalize_name(name):
    if not name:
        return ""
    cleaned = re.sub(r'\s+', ' ', str(name)).strip().lower()
    canonical = NAME_ALIASES.get(cleaned, cleaned)
    return canonical.title()

def process_and_save_image(img_data, filename):
    """Resizes and compresses images to WebP format to save space."""
    os.makedirs(IMAGE_DIR, exist_ok=True)
    out_path = os.path.join(IMAGE_DIR, f"{filename}.webp")
    
    try:
        image = Image.open(io.BytesIO(img_data))
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGBA")
        image.thumbnail((800, 800))  # Max bounding box constraint
        image.save(out_path, "WEBP", quality=80, optimize=True)
        return out_path
    except Exception as e:
        print(f"Error saving image {filename}: {e}")
        return None

def parse_workbook():
    if not os.path.exists(EXCEL_FILE):
        print(f"Error: {EXCEL_FILE} not found in current directory.")
        return

    wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)
    characters = []
    
    for sheet_name in RARITY_SHEETS:
        if sheet_name not in wb.sheetnames:
            continue
            
        ws = wb[sheet_name]
        print(f"Parsing sheet: {sheet_name}...")
        
        # Initialize openpyxl image loader
        try:
            image_loader = SheetImageLoader(ws)
        except Exception:
            image_loader = None
            print(f"Notice: No floating images extracted directly from {sheet_name}")

        # Basic scanning for character section blocks
        for row in range(1, ws.max_row + 1):
            for col in range(1, ws.max_column + 1):
                cell_value = str(ws.cell(row=row, column=col).value or "").strip()
                
                # Identify potential unit headers based on 'Grade :' or section labels
                if "Grade :" in cell_value or "GRADE :" in cell_value:
                    header_cell = ws.cell(row=max(1, row - 1), column=col).value
                    if header_cell:
                        unit_name = normalize_name(header_cell)
                        
                        char_data = {
                            "name": unit_name,
                            "rarity": sheet_name.replace(" Units", ""),
                            "sheet": sheet_name,
                            "row": row,
                            "col": col,
                            "details": cell_value
                        }
                        
                        if not any(c['name'] == unit_name for c in characters):
                            characters.append(char_data)

    print(f"\nExtracted {len(characters)} character records.")

    # Write output to JSON
    with open(OUTPUT_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"characters": characters}, f, indent=2, ensure_ascii=False)
        
    print(f"Data successfully saved to {OUTPUT_DATA_FILE}")

if __name__ == "__main__":
    parse_workbook()