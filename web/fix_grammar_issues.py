import json

# Load the quiz data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'r') as f:
    quiz_data = json.load(f)

# Specific fixes for grammatical issues
fixes = {
    'This is a Glass Cosmetic Containers': 'This is a Glass Cosmetic Container',
    'This is a Shoes': 'This is a Shoe',
}

# Process each item
updated_count = 0
for item in quiz_data['items']:
    note = item['note']
    
    for old_text, new_text in fixes.items():
        if old_text in note:
            note = note.replace(old_text, new_text)
            updated_count += 1
    
    item['note'] = note

# Save the updated data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'w') as f:
    json.dump(quiz_data, f, indent=2)

print(f"Successfully fixed {updated_count} grammatical issues!")
