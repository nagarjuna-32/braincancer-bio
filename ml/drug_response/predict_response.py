"""
Drug Response Prediction Engine
Builds regression architectures to predict IC50 values and therapeutic sensitivity.
"""
import torch
import torch.nn as nn
import numpy as np

class DrugResponseRegressionNet(nn.Module):
    """
    Multi-layer dense network mapping integrated mutation & transcriptomic signatures
    to predicted therapeutic IC50 response profiles.
    """
    def __init__(self, omics_dim: int, hidden_dim: int = 128):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(omics_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ELU(),
            nn.Dropout(0.25),
            
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.ELU(),
            nn.Dropout(0.2),
            
            nn.Linear(hidden_dim // 2, 1)  # Predicts continuous IC50 value
        )

    def forward(self, x):
        return self.model(x)

def train_drug_response(model: nn.Module, inputs: np.ndarray, targets: np.ndarray, epochs: int = 10) -> list:
    """
    Optimizes Mean Squared Error (MSE) loss for drug sensitivity mapping.
    """
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()
    
    losses = []
    model.train()
    
    # Convert numpy arrays to tensors
    input_tensor = torch.tensor(inputs, dtype=torch.float32)
    target_tensor = torch.tensor(targets, dtype=torch.float32).unsqueeze(1)
    
    for epoch in range(epochs):
        optimizer.zero_grad()
        predictions = model(input_tensor)
        loss = criterion(predictions, target_tensor)
        loss.backward()
        optimizer.step()
        losses.append(float(loss.item()))
        
    return losses
