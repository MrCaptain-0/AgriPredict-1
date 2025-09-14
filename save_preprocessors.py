import pandas as pd
import numpy as np
from sklearn import model_selection as MS
from sklearn.preprocessing import StandardScaler as SS
from sklearn.preprocessing import PolynomialFeatures as PF
from sklearn.linear_model import LinearRegression 
import joblib

# Loading dataset 
df = pd.read_csv("agri_crop_price_augmented_improved.csv")

# One-hot encoding
DF = pd.get_dummies(df, columns=["Region", "Crop", "Variety"], drop_first=True)

X = DF.drop(["Min Price (Rs/qtl)", "Max Price (Rs/qtl)", "Modal Price (Rs/qtl)"], axis=1)
Y1 = DF["Min Price (Rs/qtl)"]
Y2 = DF["Max Price (Rs/qtl)"]
Y3 = DF["Modal Price (Rs/qtl)"]

X_train, _, Y1_train, _ = MS.train_test_split(X, Y1, test_size=0.001, random_state=50)
_, _, Y2_train, _ = MS.train_test_split(X, Y2, test_size=0.001, random_state=50)
_, _, Y3_train, _ = MS.train_test_split(X, Y3, test_size=0.001, random_state=50)

scaler = SS()
X_train_scaled = scaler.fit_transform(X_train)

poly = PF(degree=2, include_bias=False)
X_train_poly = poly.fit_transform(X_train_scaled)

# Initialize and train your models
model_min = LinearRegression() 
model_max = LinearRegression() 
model_modal = LinearRegression() 

model_min.fit(X_train_poly, Y1_train)
model_max.fit(X_train_poly, Y2_train)
model_modal.fit(X_train_poly, Y3_train)

# Saveing the scaler, polynomial features, and trained models
joblib.dump(scaler, "scaler.pkl")
joblib.dump(poly, "poly_features.pkl")
joblib.dump(model_min, "Min_Price_Predictor")
joblib.dump(model_max, "Max_Price_Predictor")
joblib.dump(model_modal, "Modal_Price_Predictor")

print("Models and preprocessors retrained and saved successfully!")
