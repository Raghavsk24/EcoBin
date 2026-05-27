import json

# Items that should be drop-off recycling
dropoff_items = ['plastic_shopping_bags', 'plastic_trash_bags', 'shoes', 'clothes']

# Load the quiz data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'r') as f:
    quiz_data = json.load(f)

# Process each item
updated_count = 0
for item in quiz_data['items']:
    image_filename = item['image']
    
    # Check if this item should be drop-off recycling
    should_be_dropoff = any(dropoff_item in image_filename for dropoff_item in dropoff_items)
    
    if should_be_dropoff:
        # Update pathway
        item['pathway'] = 'dropoff_recycling'
        
        # Update explanation to mention drop-off recycling
        note = item['note']
        note = note.replace('curbside recycling', 'drop-off recycling')
        note = note.replace('curbside program', 'drop-off recycling program')
        note = note.replace('blue bin', 'drop-off recycling center')
        item['note'] = note
        
        updated_count += 1

# Save the updated data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'w') as f:
    json.dump(quiz_data, f, indent=2)

print(f"Successfully updated {updated_count} items to drop-off recycling!")
