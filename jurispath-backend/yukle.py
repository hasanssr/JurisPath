from datasets import load_dataset
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

print("Dataset indiriliyor...")
dataset = load_dataset(
    "muhamparlak/turkish-law-bge-m3-embeddings", 
    "mevzuat"
)

print("Supabase'e yükleniyor...")
batch = []

for item in dataset["train"]:
    batch.append({
        "kanun_adi": item["kanun_adi"],
        "madde_no": item["madde_no"],
        "madde_metni": item["orijinal_metin"],
        "embedding": item["vector"]
    })
    
    if len(batch) == 100:
        supabase.table("kanun_maddeleri").insert(batch).execute()
        print(f"{len(batch)} madde yüklendi...")
        batch = []

if batch:
    supabase.table("kanun_maddeleri").insert(batch).execute()

print("Tamamlandı!")