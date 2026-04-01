import requests
from pprint import pprint

url = "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&page=1&per_page=18&oppstatus=open&usertype=students&domain=2&sortBy=&orderBy=&filter_condition=&undefined=true"

params = {
    "page": 1
}

headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json"
}

res = requests.get(url, params=params, headers=headers)
pprint
(res.json())