"""
convert_images_to_png.py

Converts all non-PNG images in the Contamination Textures Dataset to lossless
PNG and removes the originals. PNG is used throughout the Stage B pipeline to
ensure the clean and contaminated sets share the same compression format,
preventing the model from learning JPEG artifacts as a contamination signal.

Supported input formats: JPEG, AVIF, WebP
Run: python convert_images_to_png.py
"""

import sys
from pathlib import Path

try:
    # pillow-avif-plugin registers AVIF support with Pillow on import
    import pillow_avif
except ImportError:
    print("WARNING: pillow-avif-plugin not installed. AVIF files will be skipped.")
    print("         Run: pip install pillow-avif-plugin\n")

from PIL import Image

DATASET_ROOT = Path(r"C:\Users\senth\EcoBin\Datasets\Contamination_Textures_Dataset")
CONVERTIBLE  = {".jpg", ".jpeg", ".avif", ".webp"}


def convert_to_png(src: Path) -> None:
    dst = src.with_suffix(".png")
    # RGBA conversion preserves any alpha channel present in WebP and AVIF sources
    img = Image.open(src).convert("RGBA")
    img.save(dst, format="PNG")
    src.unlink()


def main() -> None:
    if not DATASET_ROOT.exists():
        print(f"ERROR: directory not found:\n  {DATASET_ROOT}")
        sys.exit(1)

    all_files   = [f for f in DATASET_ROOT.rglob("*") if f.is_file()]
    to_convert  = [f for f in all_files if f.suffix.lower() in CONVERTIBLE]
    already_png = [f for f in all_files if f.suffix.lower() == ".png"]
    skipped     = []
    converted   = []
    failed      = []

    print(f"Contamination Textures Dataset converter")
    print(f"  Root         : {DATASET_ROOT}")
    print(f"  Total files  : {len(all_files)}")
    print(f"  Already PNG  : {len(already_png)}  (skipped)")
    print(f"  To convert   : {len(to_convert)}\n")

    for src in to_convert:
        ext = src.suffix.lower()
        # Skip AVIF silently if the plugin was not imported successfully
        if ext == ".avif" and "pillow_avif" not in sys.modules:
            skipped.append(src)
            print(f"  SKIP (no AVIF support)  {src.relative_to(DATASET_ROOT)}")
            continue
        try:
            convert_to_png(src)
            converted.append(src)
            print(f"  OK   {src.relative_to(DATASET_ROOT)}  ->  {src.stem}.png")
        except Exception as exc:
            failed.append((src, exc))
            print(f"  FAIL {src.relative_to(DATASET_ROOT)}  :  {exc}")

    print(f"\nDone.")
    print(f"  Converted : {len(converted)}")
    print(f"  Skipped   : {len(skipped)}")
    print(f"  Failed    : {len(failed)}")
    if failed:
        print("\nFailed files:")
        for path, err in failed:
            print(f"  {path}  :  {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
