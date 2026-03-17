from PIL import Image
import os

source = r'c:\WORKSPACE\Projects\SpineSurge\Version 0.5 (Akshaya)\SpineSurge-Pro\build\icon.png'
target = r'c:\WORKSPACE\Projects\SpineSurge\Version 0.5 (Akshaya)\SpineSurge-Pro\build\icon.ico'

try:
    img = Image.open(source)
    img.save(target, format='ICO', sizes=[(256, 256)])
    print(f"Successfully created {target}")
except Exception as e:
    print(f"Error: {e}")
