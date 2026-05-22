"""
remove_texture_background.py

Removes the white background from PNG texture images in-place using a
flood-fill approach from each image corner. Pixels within a brightness and
colour tolerance of white are made transparent. Used to prepare contamination
textures for alpha-compositing onto clean recyclable images in Stage B.

Run: python remove_texture_background.py
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from queue import Queue

DATASET_ROOT    = Path(r"C:\Users\senth\EcoBin\datasets\Contamination_Textures_Dataset")
# Pixels with all RGB channels above this threshold are treated as white
WHITE_THRESHOLD = 240
# Maximum Euclidean distance from pure white for a pixel to be removed
COLOUR_TOL      = 30


def is_background(pixel: np.ndarray) -> bool:
    # Check closeness to white using L2 distance across RGB channels
    return float(np.linalg.norm(pixel[:3].astype(int) - 255)) < COLOUR_TOL


def flood_fill_background(arr: np.ndarray) -> np.ndarray:
    """Flood-fill from all four corners to find and mark background pixels."""
    h, w  = arr.shape[:2]
    mask  = np.zeros((h, w), dtype=bool)
    q     = Queue()

    # Seed from all four corners
    for seed in [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]:
        r, c = seed
        if not mask[r, c] and is_background(arr[r, c]):
            mask[r, c] = True
            q.put((r, c))

    while not q.empty():
        r, c = q.get()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < h and 0 <= nc < w and not mask[nr, nc]:
                if is_background(arr[nr, nc]):
                    mask[nr, nc] = True
                    q.put((nr, nc))

    return mask


def remove_background(path: Path) -> None:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)

    mask          = flood_fill_background(arr)
    # Set alpha to 0 for all background pixels
    arr[mask, 3]  = 0

    Image.fromarray(arr, "RGBA").save(path, format="PNG")


def main() -> None:
    if not DATASET_ROOT.exists():
        print(f"ERROR: directory not found:\n  {DATASET_ROOT}")
        sys.exit(1)

    all_files = [f for f in DATASET_ROOT.rglob("*") if f.is_file()]
    png_files = [f for f in all_files if f.suffix.lower() == ".png"]
    processed = []
    failed    = []

    print(f"Texture background remover")
    print(f"  Root        : {DATASET_ROOT}")
    print(f"  Total files : {len(all_files)}")
    print(f"  PNG files   : {len(png_files)}\n")

    for path in png_files:
        try:
            remove_background(path)
            processed.append(path)
            print(f"  OK   {path.relative_to(DATASET_ROOT)}")
        except Exception as exc:
            failed.append((path, exc))
            print(f"  FAIL {path.relative_to(DATASET_ROOT)}  :  {exc}")

    print(f"\nDone.")
    print(f"  Processed : {len(processed)}")
    print(f"  Failed    : {len(failed)}")
    if failed:
        print("\nFailed files:")
        for path, err in failed:
            print(f"  {path}  :  {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
