#!/usr/bin/env python3
"""
Auto-replace illumination_data.json script
This script monitors the Downloads folder and automatically replaces
the illumination_data.json file when a new one is downloaded.
"""

import os
import time
import shutil
import json
from pathlib import Path
from datetime import datetime
import glob

def get_downloads_folder():
    """Get the Downloads folder path"""
    home = Path.home()
    downloads = home / "Downloads"
    return downloads

def get_project_folder():
    """Get the project folder path"""
    current_dir = Path(__file__).parent
    return current_dir

def find_latest_illumination_file():
    """Find the latest illumination_data.json in Downloads"""
    downloads = get_downloads_folder()
    
    # Look for illumination_data.json files
    pattern = str(downloads / "illumination_data*.json")
    illumination_files = glob.glob(pattern)
    
    if not illumination_files:
        return None
    
    # Sort by modification time, get the latest
    latest_file = max(illumination_files, key=os.path.getmtime)
    return Path(latest_file)

def replace_illumination_file():
    """Replace the project illumination_data.json with the latest downloaded file"""
    project_folder = get_project_folder()
    project_file = project_folder / "illumination_data.json"
    
    latest_file = find_latest_illumination_file()
    
    if not latest_file:
        print("❌ No illumination_data.json found in Downloads folder")
        print(f"📁 Looking in: {get_downloads_folder()}")
        return False
    
    try:
        # Validate the JSON file
        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'illumination_data' not in data:
            print("❌ Invalid illumination_data.json format")
            return False
        
        # Create backup of current file
        if project_file.exists():
            backup_file = project_folder / f"illumination_data_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            shutil.copy2(project_file, backup_file)
            print(f"📁 Backup created: {backup_file.name}")
        
        # Replace the file
        shutil.copy2(latest_file, project_file)
        
        # Get file info
        file_size = project_file.stat().st_size
        point_count = len(data['illumination_data'])
        
        print(f"✅ Successfully replaced illumination_data.json")
        print(f"📊 File size: {file_size:,} bytes")
        print(f"📊 Total points: {point_count:,}")
        
        if 'metadata' in data:
            metadata = data['metadata']
            if 'edited_points' in metadata:
                print(f"📊 Edited points: {metadata['edited_points']}")
            if 'deleted_points' in metadata:
                print(f"📊 Deleted points: {metadata['deleted_points']}")
        
        # Clean up the downloaded file
        try:
            latest_file.unlink()
            print(f"🗑️ Cleaned up downloaded file: {latest_file.name}")
        except:
            pass
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON file: {e}")
        return False
    except Exception as e:
        print(f"❌ Error replacing file: {e}")
        return False

def main():
    """Main function"""
    print("🔄 Auto-replace illumination_data.json")
    print("=" * 50)
    
    if replace_illumination_file():
        print("\n🎉 File replacement completed successfully!")
        print("🔄 You can now refresh your HTML editor to see the changes.")
    else:
        print("\n❌ File replacement failed!")
        print("💡 Make sure you have downloaded illumination_data.json to your Downloads folder.")

if __name__ == "__main__":
    main()
