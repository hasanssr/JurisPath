import os
import json
import httpx
import base64
import io
from fastapi import FastAPI, HTTPException, Depends, Header, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
from pypdf import PdfReader

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")

try:
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as e:
    print(f"Supabase client initialization failed: {e}")
    supabase = None

try:
    openai_client = OpenAI(api_key=openai_api_key)
except Exception as e:
    print(f"OpenAI client initialization failed: {e}")
    openai_client = None

class SoruIstek(BaseModel):
    problem: str

def get_bge_m3_embedding(text: str) -> list:
    try:
        API_URL = "https://api-inference.huggingface.co/models/BAAI/bge-m3"
        headers = {}
        hf_token = os.getenv("HF_TOKEN")
        if hf_token:
            headers["Authorization"] = f"Bearer {hf_token}"
            
        response = httpx.post(API_URL, json={"inputs": text}, headers=headers, timeout=8.0)
        if response.status_code == 200:
            res = response.json()
            if isinstance(res, list) and len(res) > 0:
                return res
    except Exception as e:
        print(f"HF embedding extraction failed: {e}")
    return None

def retrieve_relevant_laws(problem: str) -> list:
    laws_context = []
    
    if not supabase:
        return laws_context

    # 1. Try vector similarity search
    embedding = get_bge_m3_embedding(problem)
    if embedding:
        try:
            rpc_res = supabase.rpc("match_kanun_maddeleri", {
                "query_embedding": embedding,
                "match_threshold": 0.3,
                "match_count": 5
            }).execute()
            laws_context = rpc_res.data
        except Exception as e:
            print(f"RPC vector search failed: {e}")

    # 2. Fallback to keyword search if vector search failed or returned no results
    if not laws_context:
        print("Falling back to database keyword matching...")
        # Comprehensive list of Turkish stop words, common pronouns, and generic terms
        stop_words = {
            "veya", "için", "göre", "hakkında", "karşı", "böyle", "şöyle", "olan", "olarak", 
            "altında", "biraz", "sahibi", "kendi", "biri", "benim", "senin", "onun", "ev", 
            "bir", "ve", "de", "da", "ki", "mi", "mu", "mü", "heyo", "merhaba", "selam", 
            "oldu", "yeni", "nasıl", "nedir", "ne", "zaman", "kim", "nerede", "miyiz", 
            "muayyen", "beni", "bana", "onu", "ona", "yap", "et", "ol", "miyim", "mıyım"
        }
        
        # Normalize and tokenize input
        words = [w.strip(".,!?\"';:") for w in problem.lower().split()]
        
        # Stemming/Prefix matching logic: extract word roots (first 5 chars) to match suffix variations
        keywords = []
        for w in words:
            if w in stop_words or len(w) < 3:
                continue
            # Get prefix (root) to skip possessive/plural suffixes (e.g. 'sözleşmem' -> 'sözleş', 'kiracıyım' -> 'kirac')
            root = w[:5] if len(w) > 5 else w
            if root not in stop_words and root not in keywords:
                keywords.append(root)
                
        # Sort keywords by length descending to prioritize longer, more specific legal terms
        keywords = sorted(keywords, key=len, reverse=True)
        
        seen_ids = set()
        merged = []
        # Search using the top 3 most specific keywords
        for kw in keywords[:3]:
            try:
                res = supabase.table("kanun_maddeleri").select("kanun_adi, madde_no, madde_metni").ilike("madde_metni", f"%{kw}%").limit(3).execute()
                if res.data:
                    for item in res.data:
                        item_id = f"{item.get('kanun_adi')}_{item.get('madde_no')}"
                        if item_id not in seen_ids:
                            seen_ids.add(item_id)
                            merged.append(item)
            except Exception as e:
                print(f"Keyword search error for '{kw}': {e}")
        laws_context = merged[:5]

    return laws_context

async def get_current_user_and_check_credits(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Yetkilendirme başlığı (Authorization header) eksik.")
    
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Geçersiz yetkilendirme başlığı formatı.")
        
        token = parts[1]
        if not token:
            raise HTTPException(status_code=401, detail="Token bulunamadı.")

        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase bağlantısı kurulamadı.")

        # Verify token using Supabase Auth
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")
            
        user = user_response.user
        
        # Create a request-scoped client using the user's token to pass RLS checks
        user_supabase = create_client(supabase_url, supabase_key)
        user_supabase.postgrest.auth(token)
        
        # Check user profile and credit count in user_profiles table using user client
        profile_res = user_supabase.table("user_profiles").select("credits").eq("id", user.id).single().execute()
        
        if not profile_res.data:
            # Create user profile if it doesn't exist
            fullName = user.user_metadata.get("full_name") or user.user_metadata.get("name") or user.email.split("@")[0]
            insert_res = user_supabase.table("user_profiles").insert({
                "id": user.id,
                "full_name": fullName,
                "email": user.email,
                "credits": 5
            }).execute()
            credits = 5
        else:
            credits = profile_res.data.get("credits", 0)
            
        if credits <= 0:
            raise HTTPException(status_code=403, detail="Yetersiz bakiye. Lütfen kredi yükleyin.")
            
        return {"user_id": user.id, "credits": credits, "token": token}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Kimlik doğrulama başarısız: {str(e)}")

async def process_uploaded_file(file: UploadFile) -> tuple:
    """
    Processes an uploaded file.
    Returns (extracted_text, image_base64_data, mime_type)
    """
    if not file or not file.filename:
        return None, None, None
        
    content_type = file.content_type or ""
    filename = file.filename or ""
    
    if content_type.startswith("image/"):
        file_bytes = await file.read()
        base64_data = base64.b64encode(file_bytes).decode("utf-8")
        return None, base64_data, content_type
        
    elif content_type == "application/pdf" or filename.endswith(".pdf"):
        try:
            pdf_bytes = await file.read()
            pdf_file = io.BytesIO(pdf_bytes)
            reader = PdfReader(pdf_file)
            extracted_text = ""
            for page in reader.pages:
                extracted_text += (page.extract_text() or "") + "\n"
            return extracted_text, None, None
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return f"[Hata: PDF dosyası okunamadı: {str(e)}]", None, None
            
    else:
        # Try to read as plain text
        try:
            file_bytes = await file.read()
            text = file_bytes.decode("utf-8", errors="ignore")
            return text, None, None
        except Exception as e:
            return f"[Hata: Dosya okunamadı: {str(e)}]", None, None

@app.post("/analyze")
async def analiz_et(
    problem: str = Form(...),
    file: UploadFile = File(None),
    user_info: dict = Depends(get_current_user_and_check_credits)
):
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI client is not configured. Please check your API key.")

    # Process file upload if any
    extracted_text, image_base64, mime_type = await process_uploaded_file(file)
    
    # Retrieve relevant law articles
    relevant_laws = retrieve_relevant_laws(problem)
    
    # Format the law articles context for the prompt
    context_str = ""
    if relevant_laws:
        context_str = "\n".join([
            f"Kanun: {item.get('kanun_adi')}, Madde: {item.get('madde_no')}\nMetin: {item.get('madde_metni')}\n---"
            for item in relevant_laws
        ])
    else:
        context_str = "İlgili kanun maddesi veritabanında bulunamadı. Genel mevzuat bilgilerini kullanın."

    system_prompt = """
Sen, Türk hukuku konusunda uzmanlaşmış ve vatandaşlara hukuki sorunlarında rehberlik eden premium bir AI Hukuk Asistanısın.
Görevin, kullanıcının ilettiği hukuki problemi ve veritabanından çekilen kanun maddelerini analiz ederek, vatandaşın kolayca anlayabileceği sade bir dille detaylı bir yasal eylem planı (Legal Action Plan) hazırlamaktır.

ÖNEMLİ NOT: Eğer veritabanından çekilen kanun maddeleri (RAG Bağlamı) boşsa veya kullanıcının hukuki problemiyle doğrudan ilgili değilse (örneğin kira sorusunda anayasa maddeleri geldiyse), bu alakasız maddeleri tamamen göz ardı et. Bunun yerine, kendi iç yasal bilgini kullanarak kullanıcının konusuna tam uyan gerçek Türk Kanun maddelerini (örn: Türk Borçlar Kanunu, İş Kanunu, Türk Medeni Kanunu maddelerini) "laws" dizisinde listele. Maddelerin numaralarını ve kanun adlarını asla uydurma, Türkiye Cumhuriyeti yasalarındaki gerçek karşılıklarını yaz (örneğin konut kiralarında tahliye ve kira tespit için Türk Borçlar Kanunu Md. 344, 347, 350 vb. kullan).

Ayrıca "decisions" (emsal kararlar) alanında, kullanıcının konusuna birebir uyan gerçekçi Yargıtay emsal kararları oluştur (örneğin "Yargıtay 3. Hukuk Dairesi", "E. 2022/... K. 2023/..." formatında ve karar özetini Türkçe hukuk diline uygun yaz).

Eğer kullanıcı selamlama veya genel sohbet mesajı gönderirse (örneğin "merhaba", "selam", "nasılsın"), ona nazikçe karşılık ver ve hukuki bir soru sormaya davet et.

Yanıtını kesinlikle aşağıdaki JSON formatında vermelisin. Başka hiçbir açıklama veya metin ekleme.

JSON Şeması:
{
  "confidence": (0-100 arasında bir sayı, analiz güven skoru. Selamlama mesajlarında 100 kullan),
  "shortAnswer": "Kullanıcının sorusuna doğrudan, kısa ve net bir cevap (maksimum 2 cümle)",
  "plainExplanation": "Hukuki durumu sıradan bir vatandaşın anlayabileceği, hukuki terim boğuntusundan uzak, sade ve anlaşılır bir dille açıklayan metin",
  "rights": [
    "Kullanıcının sahip olduğu yasal hak 1",
    "Kullanıcının sahip olduğu yasal hak 2"
  ],
  "laws": [
    {
      "code": "Kanun adı (örn: Türk Borçlar Kanunu veya İş Kanunu)",
      "article": "Madde no (örn: Md. 347 veya Md. 17)",
      "title": "Madde başlığı veya kısa tanımı (örn: Kiracının güvencesi veya Bildirim süresi)",
      "relevance": (0-100 arasında alaka skoru)
    }
  ],
  "decisions": [
    {
      "court": "Emsal karar veren mahkeme (örn: Yargıtay 3. Hukuk Dairesi veya Yargıtay 9. Hukuk Dairesi)",
      "no": "Karar numarası (örn: E. 2022/142 K. 2023/512)",
      "summary": "Emsal kararın kullanıcının durumuyla ilişkisini özetleyen 1-2 cümle"
    }
  ],
  "requiredDocs": [
    "Bu süreçte kullanıcının toplaması/hazırlaması gereken belge (örn: Kira sözleşmesi)"
  ],
  "steps": [
    {
      "stepNum": 1,
      "title": "Adım Başlığı (Kısa ve eyleme yönelik)",
      "desc": "Bu adımda ne yapılması gerektiğini açıklayan detaylı yönerge"
    }
  ],
  "generatedDocs": [
    {
      "title": "Kullanıcıya özel oluşturulan dilekçe veya ihtarname başlığı",
      "type": "İhtarname / Dilekçe / Başvuru Formu",
      "previewText": "Kullanıcının ismi (Ayşe Kaya varsayılan), karşı taraf ve detayları içeren hazır doldurulabilir profesyonel ihtarname veya dilekçe taslağı metni. Resmi ve profesyonel bir üslup kullan."
    }
  ],
  "warnings": [
    "Kritik yasal süre uyarısı veya hak kaybı yaşanmaması için dikkat edilmesi gereken önemli husus"
  ],
  "followUps": [
    "Kullanıcının bu aşamada sorabileceği olası takip sorusu 1?",
    "Takip sorusu 2?",
    "Takip sorusu 3?"
  ]
}

ÖNEMLİ: Eğer kullanıcı hukuki olmayan genel bir mesaj gönderirse (selamlama vb.), boş diziler kullan (rights: [], laws: [], decisions: [], requiredDocs: [], steps: [], generatedDocs: [], warnings: []) ve sadece shortAnswer ile plainExplanation alanlarını doldur.
"""

    user_prompt = f"""
Kullanıcının Hukuki Sorunu:
"{problem}"

Veritabanından Çekilen İlgili Kanun Maddeleri (RAG Bağlamı):
{context_str}

Lütfen yukarıdaki problemi analiz et ve istenen JSON formatında yanıt üret.
"""

    if extracted_text:
        user_prompt += f"\n\nKullanıcı Tarafından Yüklenen Belge/Dosya Metni:\n{extracted_text}\n"

    # Multimodal message structure
    user_content = [{"type": "text", "text": user_prompt}]
    
    if image_base64:
        user_content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{mime_type};base64,{image_base64}"
            }
        })

    try:
        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"}
        )
        
        response_data = json.loads(completion.choices[0].message.content)
        
        # Decrement credits in the database since query processed successfully
        try:
            new_credits = user_info["credits"] - 1
            user_supabase = create_client(supabase_url, supabase_key)
            user_supabase.postgrest.auth(user_info["token"])
            user_supabase.table("user_profiles").update({"credits": new_credits}).eq("id", user_info["user_id"]).execute()
        except Exception as db_err:
            print(f"Error decrementing credits in database: {db_err}")

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

@app.get("/")
def root():
    return {"mesaj": "JurisPath API çalışıyor"}
