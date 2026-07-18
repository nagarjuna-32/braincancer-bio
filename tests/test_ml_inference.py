"""
Machine Learning Inference Tests
"""

import pytest
import os
import torch
from scripts.train_mri_model import AdvancedResNet

def test_mri_resnet_inference():
    model = AdvancedResNet(num_classes=4)
    model.eval()
    
    # Dummy MRI image batch [batch_size, channels, H, W]
    dummy_input = torch.randn(2, 1, 128, 128)
    
    with torch.no_grad():
        logits = model(dummy_input)
        
    assert logits.shape == (2, 4)  # 4 classes: Normal, Glioma, Meningioma, Pituitary
    probs = torch.softmax(logits, dim=1)
    assert torch.allclose(probs.sum(dim=1), torch.tensor([1.0, 1.0]), atol=1e-4)

