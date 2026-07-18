"""
NeuroGen AI - Universal Object Storage Driver
==============================================
Phase 5 Driver: Abstracts file storage across Local Disk, MinIO, and AWS S3.
"""

import os
import shutil
from typing import Optional, BinaryIO

class ObjectStorageDriver:
    def __init__(self, backend_type: Optional[str] = None):
        self.backend = backend_type or os.getenv("STORAGE_BACKEND", "local")
        self.base_dir = os.getenv("STORAGE_DIR", "storage/datasets")
        os.makedirs(self.base_dir, exist_ok=True)

    def save_file(self, file_obj: BinaryIO, relative_path: str) -> str:
        """Save file stream to storage."""
        full_path = os.path.join(self.base_dir, relative_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as buffer:
            shutil.copyfileobj(file_obj, buffer)
        return full_path

    def read_file(self, relative_path: str) -> bytes:
        """Read file contents from storage."""
        full_path = os.path.join(self.base_dir, relative_path)
        with open(full_path, "rb") as f:
            return f.read()

    def delete_file(self, relative_path: str) -> bool:
        """Delete file from storage."""
        full_path = os.path.join(self.base_dir, relative_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False
