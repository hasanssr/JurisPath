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

- 🤖 GPT-4o ile hukuki analiz
- ⚖️ İş, Tüketici, Kira, Aile, Trafik hukuku desteği
- 📊 Risk skoru (1-5)
- 🗺️ Adım adım yol haritası
- 📋 İlgili mevzuat referansları
