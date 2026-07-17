"""
NeuroGen AI Master ML Training Pipeline Runner
Coordinates training, validation splits, and model state exports.
"""
import sys
import os
import numpy as np
import pandas as pd
import torch

# Add paths to PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.preprocessing.data_loader import load_simulated_clinical_cohort, normalize_tpm, log2_transform
from ml.mri_segmentation.unet_model import UNet
from ml.tumor_classification.resnet_model import ResNet18
from ml.survival_prediction.cox_model import SurvivalCoxPipeline, DeepSurv, DeepSurvLoss
from ml.biomarker_discovery.lasso_selector import BiomarkerDiscoveryPipeline
from ml.subtype_prediction.classifier import SubtypeClassifierPipeline, SubtypeNet
from ml.drug_response.predict_response import DrugResponseRegressionNet, train_drug_response
from ml.mutation_prediction.impact_model import VariantPathogenicityPipeline
from ml.paper_recommendation.recommender import LiteratureRecommender

def execute_training_runs():
    print("======================================================================")
    print("STARTING NEUROGEN AI MASTER MACHINE LEARNING PIPELINE TRAINING")
    print("======================================================================\n")

    # 1. MRI Tumor Classification Training (ResNet18)
    print("[ML Run 1] Training MRI Tumor Classification Model (ResNet18)...")
    clf_model = ResNet18(num_classes=4, in_channels=1)
    mock_slices = torch.randn(8, 1, 128, 128)  # Batch of 8, grayscale, 128x128 slices
    mock_labels = torch.tensor([0, 1, 2, 3, 0, 1, 2, 3], dtype=torch.long)
    
    optimizer = torch.optim.Adam(clf_model.parameters(), lr=0.01)
    criterion = torch.nn.CrossEntropyLoss()
    
    clf_model.train()
    for ep in range(3):
        optimizer.zero_grad()
        outs = clf_model(mock_slices)
        loss = criterion(outs, mock_labels)
        loss.backward()
        optimizer.step()
        print(f"  * Epoch {ep+1}/3 Completed. Loss: {loss.item():.4f}")
    print("  * ResNet18 classification model trained successfully.")

    # Save to registry
    os.makedirs("../../backend/models", exist_ok=True)
    torch.save(clf_model.state_dict(), "../../backend/models/resnet_classifier.pth")
    print("  * Saved classification weights to backend/models/resnet_classifier.pth\n")

    # 2. MRI Tumor Segmentation Training (UNet)
    print("[ML Run 2] Training MRI Tumor Segmentation Model (UNet)...")
    segmenter = UNet(n_channels=4, n_classes=1, bilinear=False)
    mock_mri = torch.randn(2, 4, 64, 64)  # 2 samples, 4 channels (T1, T1ce, T2, FLAIR), 64x64
    mock_mask = torch.randn(2, 1, 64, 64)
    
    optimizer_seg = torch.optim.Adam(segmenter.parameters(), lr=0.01)
    criterion_seg = torch.nn.BCEWithLogitsLoss()
    
    segmenter.train()
    for ep in range(3):
        optimizer_seg.zero_grad()
        mask_out = segmenter(mock_mri)
        loss = criterion_seg(mask_out, mock_mask)
        loss.backward()
        optimizer_seg.step()
        print(f"  * Epoch {ep+1}/3 Completed. Loss: {loss.item():.4f}")
    print("  * UNet segmenter trained successfully.")
    torch.save(segmenter.state_dict(), "../../backend/models/unet_segmenter.pth")
    print("  * Saved segmentation weights to backend/models/unet_segmenter.pth\n")

    # 3. Survival Prediction & Cox fit
    print("[ML Run 3] Fitting Survival Prediction Pipeline (Cox PH & DeepSurv)...")
    clinical_df = load_simulated_clinical_cohort(num_samples=80)
    
    # Run Cox proportional hazard
    survival_data = clinical_df[["Age", "IDH1_Mutation", "Survival_Days", "Status"]]
    cox_pipe = SurvivalCoxPipeline()
    cox_metrics = cox_pipe.fit(survival_data, duration_col="Survival_Days", event_col="Status")
    print(f"  * Cox PH Concordance Index (C-Index): {cox_metrics['concordance_index']:.4f}")
    print("  * Hazard Coefficients:", cox_metrics["hazard_ratios"])
    
    # Train DeepSurv Neural Hazard model
    deep_surv = DeepSurv(in_features=2, hidden_dim=8)
    surv_loss = DeepSurvLoss()
    
    surv_inputs = torch.tensor(survival_data[["Age", "IDH1_Mutation"]].values, dtype=torch.float32)
    surv_times = torch.tensor(survival_data["Survival_Days"].values, dtype=torch.float32)
    surv_events = torch.tensor(survival_data["Status"].values, dtype=torch.float32)
    
    opt_surv = torch.optim.Adam(deep_surv.parameters(), lr=0.01)
    deep_surv.train()
    for ep in range(5):
        opt_surv.zero_grad()
        hazard_outs = deep_surv(surv_inputs).squeeze()
        loss = surv_loss(hazard_outs, surv_times, surv_events)
        loss.backward()
        opt_surv.step()
    print("  * DeepSurv neural survival model fitted.\n")

    # 4. Biomarker Discovery (LASSO L1)
    print("[ML Run 4] Running Biomarker Discovery Feature Selection...")
    np.random.seed(42)
    # Simulate expression matrix: 50 patients, 100 candidate genes
    expr_matrix = pd.DataFrame(np.random.randn(50, 100), columns=[f"GENE_{i}" for i in range(100)])
    # target survival time correlation
    targets = expr_matrix["GENE_7"].values * 3.2 - expr_matrix["GENE_22"].values * 1.5 + np.random.randn(50) * 0.5
    
    biomarker_pipe = BiomarkerDiscoveryPipeline()
    lasso_ranks = biomarker_pipe.fit_lasso_selection(expr_matrix, targets)
    print("  * Top 5 Identified Biomarker Genes via LASSO L1:")
    for gene, coef in lasso_ranks[:5]:
        print(f"    - {gene}: coef weight = {coef:.4f}")
    print("")

    # 5. Subtype Classification SVM
    print("[ML Run 5] Training Subtype Classifier (SVM)...")
    mock_X = np.random.randn(60, 10)  # 60 samples, 10 selected driver features
    mock_y = np.random.choice([0, 1, 2], size=60)  # Subclasses: Classical, Mesenchymal, Proneural
    
    subtype_pipe = SubtypeClassifierPipeline()
    subtype_res = subtype_pipe.fit_svm(mock_X, mock_y)
    print(f"  * Subtype classifier accuracy (5-fold CV): {subtype_res['cross_validation_accuracy']:.4f}\n")

    # 6. Drug Response Prediction
    print("[ML Run 6] Training Drug Response Prediction Net...")
    drug_net = DrugResponseRegressionNet(omics_dim=12, hidden_dim=16)
    mock_input_drug = np.random.randn(40, 12)
    mock_ic50 = np.random.uniform(0.1, 10.0, size=40)
    
    losses = train_drug_response(drug_net, mock_input_drug, mock_ic50, epochs=5)
    print(f"  * Drug response training completed. Final train MSE: {losses[-1]:.4f}\n")

    # 7. Mutation Impact (Pathogenicity)
    print("[ML Run 7] Training Mutation Pathogenicity Predictor...")
    mut_df = pd.DataFrame({
        "SIFT": np.random.uniform(0, 1.0, size=100),
        "PolyPhen": np.random.uniform(0, 1.0, size=100),
        "Pathogenic": np.random.choice([0, 1], p=[0.7, 0.3], size=100)
    })
    patho_pipe = VariantPathogenicityPipeline()
    patho_res = patho_pipe.fit_impact_classifier(mut_df, "Pathogenic")
    print(f"  * Somatic Variant Pathogenicity classifier accuracy: {patho_res['overall_accuracy']:.4f}\n")

    # 8. Literature Paper Recommendation
    print("[ML Run 8] Querying Scientific Paper Recommender...")
    recommender = LiteratureRecommender()
    query_vector = np.array([0.10, 0.75, -0.12, 0.38])
    recommendations = recommender.recommend(query_vector, top_k=2)
    print("  * Top Semantic Literature Recommendations for project:")
    for rec in recommendations:
        print(f"    - Title: '{rec['title']}' ({rec['journal']}) - similarity: {rec['similarity_score']}")
    print("")

    print("======================================================================")
    print("MASTER MACHINE LEARNING PIPELINE TRAINING COMPLETED SUCCESSFULLY")
    print("======================================================================")

if __name__ == "__main__":
    execute_training_runs()
