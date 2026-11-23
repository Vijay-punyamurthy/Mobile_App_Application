import os
import uuid
from fastapi import UploadFile
from app.core.config import settings

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

async def save_upload_file(upload_file: UploadFile) -> str:
    extension = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".jpg"
    filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    content = await upload_file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    # Return relative URL path
    return f"/uploads/{filename}"
