import requests
import pdfplumber
from io import BytesIO

response = requests.get("https://d8it4huxumps7.cloudfront.net/uploads/attachements/files/892a0493-d2ed-4f6e-a79c-dbdfde02a6d5.pdf")
pdf_bytes = BytesIO(response.content)

with pdfplumber.open(pdf_bytes) as pdf:
    text = "\n".join(
        page.extract_text() or ""
        for page in pdf.pages
    )

print(text)