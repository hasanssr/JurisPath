# JurisPath

Türk Hukuku AI Asistanı - React Native (Expo) + FastAPI

## Proje Yapısı

```
/jurispath-backend   → FastAPI backend
/jurispath-mobile    → React Native Expo mobil uygulama
```

## Backend Kurulumu

```bash
cd jurispath-backend

# Sanal ortam oluştur
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Bağımlılıkları yükle
pip install -r requirements.txt

# .env dosyasını düzenle - OpenAI API anahtarını ekle
# OPENAI_API_KEY=sk-your-key-here

# Sunucuyu başlat
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Mobil Uygulama Kurulumu

```bash
cd jurispath-mobile

# Bağımlılıkları yükle
npm install

# Expo'yu başlat
npx expo start
```

## API Uç Noktası

**POST** `/analyze`

```json
{
  "problem": "İş sözleşmem feshedildi, haklarım nelerdir?"
}
```

## Özellikler

- 🤖 GPT-4o ile detaylı hukuki analiz ve otomatik dilekçe/ihtarname üretimi
- ⚖️ İş, Tüketici, Kira, Aile, Ceza ve Trafik hukuku desteği
- 📊 Güven & Risk Skoru (%1 - %100)
- 🗺️ Adım adım yasal eylem planı ve yol haritası
- 📋 İlgili T.C. mevzuatı ve kanun maddesi referansları (RAG / Vektör Arama desteği)
- 📄 Belge ve Görsel analizi (PDF ve fotoğraf okuma desteği)
