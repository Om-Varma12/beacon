import requests
import pdfplumber
from io import BytesIO

def download():
    response = requests.get("https://d8it4huxumps7.cloudfront.net/uploads/attachements/files/b92bc748-60f0-429b-a7d6-c7ebf6978d9b.pdf")
    pdf_bytes = BytesIO(response.content)

    with pdfplumber.open(pdf_bytes) as pdf:
        text = "\n".join(
            page.extract_text() or ""
            for page in pdf.pages
        )

    return (text)