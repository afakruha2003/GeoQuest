# GeoQuest 🌍

> **Dünyayı Keşfet, Kendini Test Et.**
> REST Countries API ile dünya ülkelerini keşfeden, coğrafi bilgiler öğreten ve interaktif quizlerle bilgini test eden React Native mobil uygulaması.

---

## 📸 Ekran Görüntüleri

*(Hazır olduğunda aşağıdaki yolları gerçek dosyalarınla değiştir)*

<div align="center">
  <img src="docs/screenshots/login.jpeg" width="200" alt="giriş"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/home1.jpeg" width="200" alt="Ana Sayfa"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/home2.jpeg" width="200" alt="Ana Sayfa"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/home3.jpeg" width="200" alt="Ana Sayfa"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/explore.jpeg" width="200" alt="Keşfet"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/detail1.jpeg" width="200" alt="Ülke Detay"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/detail2.jpeg" width="200" alt="Ülke Detay"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/progress1.jpeg" width="200" alt="ilerleme"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/quiz1.jpeg" width="200" alt="Quiz"/>
  &nbsp;&nbsp;
  <img src="docs/screenshots/quiz3.jpeg" width="200" alt="Quiz"/>
</div>

---

## ✨ Özellikler

### 🏠 Ana Sayfa
- **Günün Ülkesi:** Her gün dönen, hızlı bilgiler içeren öne çıkan ülke kartı.
- **Günlük Quiz:** Streakini canlı tutmak için 10 soruluk günlük meydan okuma.
- **Kıta Özeti:** Keşfedilen ülkelerin kıtaya göre hızlı ilerleme takibi.
- **Son Rozetler:** En son kazandığın başarımlar.

### 🔍 Keşfet & Ara
- **Akıllı Arama:** 300ms debounce ile anlık filtreleme.
- **Filtre & Sıralama:** Kıtaya göre filtrele, A-Z / Nüfus / Yüzölçüm'e göre sırala.
- **Grid / Liste Görünüm:** Kompakt grid veya detaylı liste arasında geçiş yap.
- **Keşif Takibi:** Keşfettiğin ülkelerde yeşil tik göstergesi.

### 🗺️ Ülke Detay
- Genel Bilgi, Demografi, Dil & Para Birimi, Zaman Dilimi detayları.
- **Komşu Ülkeler:** Sınır komşularının yatay scroll listesi.
- **Mini Quiz:** Seçilen ülkeye özel 5 soruluk quiz.
- **Google Maps:** Ülkeyi doğrudan haritada aç.

### 🧠 Quizler
- **3 Farklı Mod:**
  1. **Bayrağı Bul** — Bayrağa bakarak ülkeyi tahmin et (15 sn/soru).
  2. **Başkenti Bul** — Ülke adından başkenti bul (20 sn/soru).
  3. **Ülkeyi Tahmin Et** — Kıta → Nüfus → Komşu → Para Birimi → Bayrak sırasıyla ipuçları açılır. Az ipucuyla bil, yüksek puan al!
- **Streak Sistemi:** Üst üste doğru cevaplara bonus puan ve animasyon.
- **Yanlışları Çalış:** Daha önce yanlış bildiğin ülkelerden soru üret.
- **Kıtaya Göre Quiz:** Sadece seçilen kıtanın ülkelerinden soru.

### 📊 İlerleme & Rozetler
- Kıta bazlı animasyonlu ilerleme çubukları.
- 12 kazanılabilir rozet.
- Quiz geçmişi ve doğruluk istatistikleri içeren profil ekranı.

---

## 🛠️ Teknolojiler

| | |
|---|---|
| Framework | React Native (Expo) |
| Dil | TypeScript |
| Navigasyon | React Navigation (Bottom Tabs + Stack) |
| HTTP | Axios |
| State | Custom Hooks + AsyncStorage |
| UI | StyleSheet · expo-linear-gradient · react-native-safe-area-context |
| Görsel | expo-image |
| API | REST Countries API v3.1 |

---

## 📂 Proje Yapısı

```
src/
├── api/          # Axios instance ve API servisleri
├── components/   # Tekrar kullanılabilir UI bileşenleri
├── config/   
├── hooks/        # Custom hook'lar (useCountries, useQuiz)
├── navigation/   # Tab ve stack navigator'lar
├── screens/      # Uygulama ekranları
├── store/        # AsyncStorage veri yönetimi
├── theme/        # Renkler, spacing, typography
└── types/        # TypeScript arayüzleri
```

---

## ⚙️ Kurulum

```bash
# Repoyu klonla
git clone https://github.com/afakruha2003/GeoQuest.git
cd GeoQuest

# Bağımlılıkları yükle

```bash
npx create-expo-app GeoQuest --template expo-template-blank-typescript
cd GeoQuest

npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install axios @react-native-async-storage/async-storage
npx expo install expo-linear-gradient expo-image
npx expo install react-native-safe-area-context react-native-screens react-native-gesture-handler

npx expo start
```

---
# Geliştirme sunucusunu başlat
npx expo start
```

Başladıktan sonra:
- `a` → Android emülatörde çalıştır
- `i` → iOS simülatörde çalıştır
- QR kodu tara → fiziksel cihazda Expo Go ile aç

---

## 🌐 API

REST Countries API v3.1 kullanılır — ücretsiz, key gerekmez.

Performans için yalnızca gerekli alanlar çekilir:
```
/all?fields=name,flags,capital,population,area,region,subregion,languages,currencies,borders,cca3,maps
```

Veriler uygulama açılışında bir kez çekilir ve bellekte cache'lenir.

---

## 💾 Yerel Depolama (AsyncStorage)

Tüm kullanıcı verisi cihazda yerel olarak saklanır:

| Anahtar | Açıklama |
|---|---|
| `kesfedilen_ulkeler` | Keşfedilen ülkelerin cca3 kodları |
| `favori_ulkeler` | Favorilenen ülkeler |
| `quiz_skorlari` | Quiz denemelerinin detaylı geçmişi |
| `yanlis_ulkeler` | Yanlış bilinen ülkeler (tekrar çalış) |
| `rozetler` | Rozet kazanım durumları |
| `streak_data` | Günlük streak takibi |
| `gunluk_quiz` | Günlük quiz durumu |

---

## 🏅 Rozet Sistemi

| Rozet | Koşul |
|---|---|
| 🌱 İlk Adım | İlk ülkeyi keşfet |
| 🌍 Gezgin | 10 ülke keşfet |
| 🗺️ Kaşif | 50 ülke keşfet |
| 🌐 Dünya Vatandaşı | 100 ülke keşfet |
| 🧠 Quiz Başlangıcı | İlk quizi tamamla |
| 🏆 Quiz Ustası | 500 puan kazan |
| 🔥 Ateş | 5 doğru üst üste |
| ⚡ Durulamaz | 10 doğru üst üste |
| 🌍 Afrika Kaşifi | Afrika'nın tüm ülkelerini keşfet |
| 🇪🇺 Avrupa Kaşifi | Avrupa'nın tüm ülkelerini keşfet |
| 💯 Mükemmel | Quiz'de %100 doğruluk |
| 📅 Azimli | 7 gün üst üste quiz çöz |

---

## 🎨 Tasarım Sistemi

Okunabilirlik ve bayrak renkleri için optimize edilmiş modern koyu tema:

| Token | Değer |
|---|---|
| Background | `#0D1B2A` |
| Surface / Card | `#1B2838` / `#1E3A5F` |
| Primary | `#00D4AA` |
| Accent | `#FFD700` |
| Danger / Success | `#FF4757` / `#2ED573` |

---

## 📄 Lisans

MIT License.
