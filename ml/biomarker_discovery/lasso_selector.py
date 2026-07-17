"""
Biomarker Discovery & Feature Selection Pipeline
Utilizes L1 regularization (LASSO) and Random Forest feature importances to rank candidate biomarkers.
"""
import numpy as np
import pandas as pd
from typing import List, Tuple, Dict

class BiomarkerDiscoveryPipeline:
    """
    Identifies driver biomarkers from thousands of expression rows.
    """
    def __init__(self, alpha: float = 0.1):
        self.alpha = alpha

    def fit_lasso_selection(self, X: pd.DataFrame, y: np.ndarray) -> List[Tuple[str, float]]:
        """
        Fits a LASSO regression model to rank features by non-zero L1 coefficients.
        Falls back to univariate Pearson/Spearman correlation if scikit-learn is missing.
        """
        try:
            from sklearn.linear_model import LassoCV
            from sklearn.preprocessing import StandardScaler
            
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Cross-validated LASSO L1 selector
            lasso = LassoCV(cv=5, random_state=42).fit(X_scaled, y)
            coefs = lasso.coef_
            
            ranked_features = []
            for col, coef in zip(X.columns, coefs):
                if abs(coef) > 1e-5:
                    ranked_features.append((col, float(coef)))
                    
            # Sort by absolute impact
            ranked_features.sort(key=lambda val: abs(val[1]), reverse=True)
            return ranked_features
            
        except ImportError:
            # Fallback Correlation Coefficient ranking
            correlations = []
            for col in X.columns:
                corr = np.corrcoef(X[col].values, y)[0, 1]
                if not np.isnan(corr):
                    correlations.append((col, float(corr)))
            correlations.sort(key=lambda val: abs(val[1]), reverse=True)
            return correlations

    def fit_random_forest_importance(self, X: pd.DataFrame, y: np.ndarray) -> List[Tuple[str, float]]:
        """
        Computes feature importances using a Random Forest model.
        """
        try:
            from sklearn.ensemble import RandomForestRegressor
            
            rf = RandomForestRegressor(n_estimators=100, random_state=42)
            rf.fit(X, y)
            importances = rf.feature_importances_
            
            ranked = sorted(zip(X.columns, importances), key=lambda val: val[1], reverse=True)
            return [(name, float(val)) for name, val in ranked]
            
        except ImportError:
            # Simple Variance-based rank fallback if RF is not installed
            variances = X.var(axis=0)
            ranked = sorted(zip(X.columns, variances), key=lambda val: val[1], reverse=True)
            return [(name, float(val)) for name, val in ranked]
