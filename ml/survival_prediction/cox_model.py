"""
Cox Proportional Hazards and DeepSurv Survival Prediction Models
Predicts hazard ratios and maps survival risks based on clinical and genomic features.
"""
import numpy as np
import pandas as pd
from lifelines import CoxPHFitter
from typing import Dict, Any

class SurvivalCoxPipeline:
    """
    Standard Cox Proportional Hazards pipeline using lifelines.
    Fits hazard coefficients to predict patient survival curves.
    """
    def __init__(self):
        self.cph = CoxPHFitter()

    def fit(self, df: pd.DataFrame, duration_col: str, event_col: str) -> Dict[str, Any]:
        """
        Fits Cox Proportional Hazards model to clinical dataset.
        """
        self.cph.fit(df, duration_col=duration_col, event_col=event_col)
        summary = self.cph.summary
        return {
            "concordance_index": self.cph.concordance_index_,
            "coefficients": summary["coef"].to_dict(),
            "p_values": summary["p"].to_dict(),
            "hazard_ratios": np.exp(summary["coef"]).to_dict()
        }

    def predict_survival(self, input_features: pd.DataFrame) -> pd.DataFrame:
        """
        Predicts conditional survival curves over time for given subject inputs.
        """
        return self.cph.predict_survival_function(input_features)

# DeepSurv PyTorch Model Structure
import torch
import torch.nn as nn

class DeepSurvLoss(nn.Module):
    """
    Partial Likelihood Loss for Cox proportional hazard models.
    Formula: Loss = - sum_{i: E_i=1} ( h_i - log( sum_{j: T_j >= T_i} exp(h_j) ) )
    """
    def __init__(self):
        super().__init__()

    def forward(self, hazard_ratios: torch.Tensor, survival_times: torch.Tensor, events: torch.Tensor) -> torch.Tensor:
        # Sort survival times descending
        _, idx = torch.sort(survival_times, descending=True)
        hazard_ratios = hazard_ratios[idx]
        events = events[idx]

        hazard_exp = torch.exp(hazard_ratios)
        hazard_exp_cumsum = torch.cumsum(hazard_exp, dim=0)
        
        # Log partial likelihood loss
        log_risk = torch.log(hazard_exp_cumsum)
        uncensored_loss = hazard_ratios - log_risk
        
        loss = -torch.sum(uncensored_loss * events) / torch.clamp(torch.sum(events), min=1.0)
        return loss

class DeepSurv(nn.Module):
    """
    Deep Neural Network based Survival Hazard estimator (DeepSurv).
    Processes deep non-linear multi-omics feature relationships.
    """
    def __init__(self, in_features: int, hidden_dim: int = 32):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1, bias=False)  # Cox hazard score has no bias
        )

    def forward(self, x):
        return self.network(x)
