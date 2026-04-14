import os
import glob
import re

new_logo = '''            <svg class="sleek-logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path class="globe-path" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                <path class="globe-path" d="M2 12H22" />
                <path class="globe-path" d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" />
            </svg>
            <span class="sidebar-label-container" style="margin-left: 12px; transform: none; opacity: 1;">
                <svg class="sleek-logo-text-svg" viewBox="0 0 180 30" width="140" height="24">
                    <text x="0" y="22" font-family="'Outfit', sans-serif" font-weight="700" font-size="22" class="sleek-text-path">MBBS Abroads</text>
                </svg>
            </span>'''

files = glob.glob('*.html') + glob.glob('blogs/*.html')

for filepath in files:
    if filepath == 'index.html':
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to match the old logo blocks
    # We want to replace the contents INSIDE <div class=\"sidebar-logo\"...>
    pattern = re.compile(r'(<div class="sidebar-logo"[^>]*>)\s*<div class="h-5 w-6 rounded-br-lg[^>]+>\s*</div>\s*<span[^>]*>FEFU.*?</span>', re.DOTALL)
    
    new_content = pattern.sub(r'\g<1>\n' + new_logo, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Updated " + filepath)
