import requests

url = "https://railway.com/project/5634ffa8-071c-4e5b-9913-ea187bdf670a/predict"
data = {"features": [5.1, 3.5, 1.4, 0.2]}
response = requests.post(url, json=data)

print(response.text)  # Print raw response for debugging
try:
    print(response.json())
except Exception as e:
    print(f"Error parsing JSON: {e}")
