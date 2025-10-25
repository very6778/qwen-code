## Başlıca Akışlar

- CLI açılış noktası config’i, uzantıları ve temaları yükleyip güvenlik kontrollerini tamamlıyor; etkileşimli kip `startInteractiveUI` ile Ink tabanlı uygulamayı render ediyor (`packages/cli/src/gemini.tsx:201`, `packages/cli/src/gemini.tsx:129`).
- Sandbox, bellek ayarları ve OAuth doğrulamaları etkileşime girmeden önce temizleniyor; CLI bu aşamada gerektiğinde yeniden başlatılıyor (`packages/cli/src/gemini.tsx:286`).

## UI Katmanı

- `AppWrapper` Ink uygulamasını Keypress, SessionStats ve Vim context’leriyle sarmalayıp tüm kancalara ortak yetenekler sunuyor (`packages/cli/src/ui/App.tsx:140`).
- Ana `App` bileşeni geçmiş, kuyruk ve dialog yönetimini organize ediyor; geçmiş çıktılar `Static` içinde dondurulmuş, canlı akış ise ayrı bir pending listede tutuluyor (Claude Code benzeri üst/bottom bölünme) (`packages/cli/src/ui/App.tsx:161`, `packages/cli/src/ui/App.tsx:1130`).

## İlk Girdi İşleyişi

- Kullanıcı satırı `InputPrompt` üzerinden geliyor; submit edildiğinde metin önce mesaj kuyruğuna düşüyor, böylece model cevap üretirken birden fazla komut sıraya alınabiliyor (`packages/cli/src/ui/App.tsx:1446`, `packages/cli/src/ui/App.tsx:793`, `packages/cli/src/ui/hooks/useMessageQueue.ts:27`).
- Kuyruk boşsa `submitQuery` tetikleniyor; Slash/@ komutları, shell kipine delegasyon, loglama gibi ön işlemler `prepareQueryForGemini` içinde çözülüyor ve kullanıcı mesajı geçmişe yazılıyor (`packages/cli/src/ui/hooks/useGeminiStream.ts:268`, `packages/cli/src/ui/hooks/useGeminiStream.ts:343`).
- Bu aşamada yeni bir prompt kimliği oluşturuluyor, oturum sayaçları güncelleniyor ve stream başlatılıyor (`packages/cli/src/ui/hooks/useGeminiStream.ts:693`).

## Akış ve Araçlar

- Sunucudan gelen Thought/Content/Finished olayları doğrudan geçmişe yansıyor; streaming sırasında aktarılan bloklar performans için parçalanıp `Static`’e kilitleniyor (`packages/cli/src/ui/hooks/useGeminiStream.ts:400`, `packages/cli/src/ui/App.tsx:1138`).
- Tool çağrıları `ToolCallRequest` ile yakalanıp React tabanlı görev zamanlayıcısına aktarılıyor; tamamlanan çağrılar yeniden Gemini’ya gönderilmeden önce UI’da pending/past durumuna ayrılıyor (`packages/cli/src/ui/hooks/useGeminiStream.ts:633`, `packages/cli/src/ui/hooks/useGeminiStream.ts:774`).
- Akış bittiğinde kuyruktaki mesajlar otomatik işleniyor, abort/kapatma gibi durumlar `App` içindeki handler’lar tarafından terminali temizleyerek yönetiliyor (`packages/cli/src/ui/hooks/useMessageQueue.ts:53`, `packages/cli/src/gemini.tsx:170`).

