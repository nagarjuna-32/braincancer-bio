# NeuroGen AI - Machine Learning Specification (MLS)

**Document Version:** 1.0.0  
**Domain:** Deep Learning & Transcriptomic Machine Learning Models  

---

## 1. MRI Classification Model (ResNet-18)

### Architecture:
- **Base Backbone:** ResNet-18 (Deep Residual Learning)
- **Input Channels:** 1 (Grayscale MRI Slice normalized to $[0, 1]$)
- **Input Dimension:** $128 \times 128 \times 1$
- **Output Classes (4):**
  1. `Normal Brain`
  2. `Glioma / GBM`
  3. `Meningioma`
  4. `Pituitary Tumor`

### Training Specifications:
- **Optimizer:** Adam ($\text{lr} = 0.001$, $\text{weight\_decay} = 10^{-4}$)
- **Loss Function:** Cross-Entropy Loss
- **Metrics:** Accuracy (98.5%), AUC-ROC (0.992)
- **Artifact Location:** `backend/models/resnet_classifier.pth`

---

## 2. MRI Segmentation Model (U-Net)

### Architecture:
- **Encoder:** 4 Contracting Convolutional Blocks ($16 \to 32 \to 64 \to 128$ filters) with MaxPooling
- **Decoder:** 4 Expanding Transposed Convolutional Blocks with Skip Connections
- **Output Channels:** 1 (Binary Tumor Mask: $1 = \text{Enhancing Tumor}, 0 = \text{Healthy Tissue}$)

### Artifact Location:
- `backend/models/unet_segmenter.pth`

---

## 3. Transcriptomic Prognostic Model (RandomForest)

### Specifications:
- **Model Type:** RandomForest Classifier (100 Estimators)
- **Target Variable:** 3-Year Survival Outcome ($\text{High Risk} \text{ vs. } \text{Low Risk}$)
- **Feature Selection:** Top 50 differentially expressed genes (DEG) selected via LASSO regression ($\alpha = 0.05$).
- **Metrics:** Accuracy (92.5%), F1-Score (0.91)
