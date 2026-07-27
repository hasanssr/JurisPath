# JurisPath

**Türk vatandaşlarının günlük hukuki sorunlarını yapay zeka ile analiz eden mobil hukuk asistanı.**

## Bu Proje Ne Yapar?

Türkiye'de birçok vatandaş, karşılaştığı hukuki sorunlarda haklarını bilmediği için mağdur kalır. JurisPath, iş hukuku, kira anlaşmazlıkları, tüketici hakları, aile hukuku ve trafik cezaları gibi günlük yaşamda sıkça karşılaşılan hukuki problemleri yapay zeka ile analiz ederek vatandaşa sade bir dille yasal haklarını, izlemesi gereken adımları ve gerekli belgeleri sunar.

Uygulama yalnızca bilgi vermekle kalmaz; ilgili T.C. kanun maddelerini veritabanından çeker, duruma özel dilekçe/ihtarname taslağı oluşturur ve kullanıcıya somut bir eylem planı hazırlar.

## Öne Çıkan Özellikler

- 🤖 **AI Destekli Hukuki Analiz** — GPT-4o-mini ile kullanıcının sorununu analiz eder, sade dilde açıklama ve yasal eylem planı üretir
- ⚖️ **Geniş Hukuk Alanı Desteği** — İş, Tüketici, Kira, Aile, Ceza ve Trafik hukuku kapsamında analiz yapabilir
- 📊 **Güven Skoru (%1–%100)** — Her analize, yapay zekanın konuya hakimiyetini gösteren bir güven yüzdesi eşlik eder
- 📋 **Kanun Maddesi Referansları** — Supabase üzerindeki vektör veritabanından (pgvector) ilgili T.C. kanun maddelerini RAG yöntemiyle çeker
- 📄 **Belge ve Görsel Analizi** — Kullanıcı PDF veya fotoğraf yükleyerek sözleşme, ihbarname gibi belgeleri analize dahil edebilir
- 📝 **Otomatik Dilekçe Üretimi** — Duruma özel ihtarname ve dilekçe taslağı oluşturur, PDF olarak indirilebilir
- 🗺️ **Adım Adım Yol Haritası** — Hukuki süreçte izlenmesi gereken adımları, gerekli belgeleri ve süre uyarılarını listeler

## Teknoloji Stack'i

| Katman | Teknoloji |
|--------|-----------|
| **Mobil Uygulama** | React Native (Expo), expo-image |
| **Kimlik Doğrulama** | Supabase Auth (Email/Şifre, Google OAuth) |
| **Backend API** | Python, FastAPI, Uvicorn |
| **Yapay Zeka** | OpenAI GPT-4o-mini (JSON mode, multimodal) |
| **RAG Pipeline** | HuggingFace BGE-M3 embedding → Supabase pgvector |
| **Veritabanı** | Supabase (PostgreSQL + pgvector + RLS) |
| **Belge İşleme** | pypdf (PDF metin çıkarma), Base64 görsel kodlama |

## 📱 Ekran Görüntüleri

> _Ekran görüntüleri yakında eklenecektir._

<!--
Ekran görüntülerini assets/screenshots/ klasörüne ekledikten sonra:

![Ana Ekran](assets/screenshots/dashboard.png)
![AI Analiz](assets/screenshots/ai_screen.png)
![Dilekçe Önizleme](assets/screenshots/document.png)
-->

## Proje Yapısı

```
jurispath-backend/    → FastAPI backend (RAG + LLM API)
jurispath-mobile/     → React Native / Expo mobil uygulama
```

## Kurulum

### Backend

```bash
cd jurispath-backend

# Sanal ortam oluştur ve aktifleştir
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Bağımlılıkları yükle
pip install -r requirements.txt

# .env dosyası oluştur ve API anahtarlarını ekle
# OPENAI_API_KEY=sk-your-key-here
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key

# Sunucuyu başlat
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Mobil Uygulama

```bash
cd jurispath-mobile

# Bağımlılıkları yükle
npm install

# Expo'yu başlat
npx expo start
```

### API Uç Noktası

**POST** `/analyze`

```json
{
  "problem": "İş sözleşmem feshedildi, haklarım nelerdir?"
}
```

## Lisans

Bu proje kişisel bir portföy çalışmasıdır.
