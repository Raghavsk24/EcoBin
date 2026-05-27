import json
import re

# Load the quiz data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'r') as f:
    quiz_data = json.load(f)

# Process each item
updated_count = 0
for item in quiz_data['items']:
    image_filename = item['image']
    note = item['note']
    
    # Extract base name from filename (e.g., "aerosol_cans_1.jpg" -> "aerosol_cans")
    base_name = image_filename.split('/')[-1].rsplit('_', 1)[0]
    
    # If base name ends with 's', create a singular version
    if base_name.endswith('s') and not base_name.endswith('ss'):
        singular_name = base_name[:-1]
        
        # Replace in the note
        # Look for "This is a {plural_name}" and replace with "This is a {singular_name}"
        old_pattern = f"This is a {base_name.replace('_', ' ')}"
        new_pattern = f"This is a {singular_name.replace('_', ' ')}"
        
        if old_pattern in note:
            note = note.replace(old_pattern, new_pattern)
            item['note'] = note
            updated_count += 1

# Save the updated data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'w') as f:
    json.dump(quiz_data, f, indent=2)

print(f"Successfully updated {updated_count} items to use singular form!")
