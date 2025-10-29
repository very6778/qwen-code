Bu bir cli(terminal) interface coding agent projesidir

## Mimari Genel Bakış

Bu doküman, Qwen Code’un tüm kritik akışlarını tek yerde özetlemek için hazırlandı. Amaç, projeye yeni giren bir yazılım mühendisinin CLI’yi, Ink tabanlı UI’yi, streaming/tanılama katmanlarını ve sandbox/auth mekanizmasını “bizatihi yazmış gibi” kavrayabilmesidir.

- **Giriş Noktası:** `packages/cli/src/gemini.tsx` içindeki `main()` fonksiyonu yapılandırmayı, temaları ve sandbox ayarlarını yükler; ardından `startInteractiveUI()` ile Ink uygulamasını tetikler veya non-interactive kipte `runNonInteractive()` çalıştırır.
- **UI Zinciri:** `startInteractiveUI → AppWrapper → App` hattı; AppWrapper Keypress/SessionStats/Vim context’lerini sağlar, `App` ise geçmiş/pending bölünmesini, diyalogları, input tamponunu ve streaming durumuna göre UI’yi sürer (`packages/cli/src/ui/App.tsx`).
- **Mesaj Yaşam Döngüsü:** Input, `useMessageQueue` tarafından kuyruğa alınır, `useGeminiStream` query’i slash/@ komutlarından geçirir, shell kipini tetikler veya Gemini’ya gönderir. Stream tamamlandığında kuyruk otomatik boşalır.
- **Araç/Shell Yönetimi:** Tool çağrıları `useReactToolScheduler` (CoreToolScheduler wrapper’ı) üzerinden planlanır; shell komutları da aynı tool grubu UI’sini kullanır. Onay bekleyen araçlar `StreamingState.WaitingForConfirmation` durumunu tetikler.
- **Güvenlik ve Telemetry:** Sandbox yeniden başlatmaları, OAuth doğrulamaları, folder trust akışı ve token/turn sayaçları start aşamasında devreye alınır; `ConsolePatcher` ve `log*` çağrıları global telemetriyi yönetir.

---

## 1. CLI Başlangıcı ve Ortam Hazırlığı (`packages/cli/src/gemini.tsx`)

1. **Settings + Arg Parse:** `loadSettings()` kullanıcı/workspace yapılandırmasını okur, hatalar `FatalConfigError` ile durdurulur. `parseArguments()` birleşik ayarlara göre CLI bayraklarını çözer. (`main()`, satır 205+)
2. **Extension ve Config:** `loadExtensions()` dizindeki uzantıları taşıyor; `loadCliConfig()` bunları, session kimliğini ve argümanları harmanlayarak `Config` nesnesini kuruyor.
3. **Console & DNS:** `ConsolePatcher` stdout/stderr’ı yakalayıp UI’ye taşır; `dns.setDefaultResultOrder(validateDnsResolutionOrder(...))` ile IPv4-first davranışı sağlanır.
4. **Auth ve Tema Hazırlığı:** Varsayılan auth tipi Cloud Shell ortamlarında otomatik seçiliyor, boş API anahtarları temizleniyor. `themeManager.loadCustomThemes()` ve `setActiveTheme()` kullanıcı temalarını uygular.
5. **Sandbox + Bellek:** Sandbox dışındaysak `getNodeMemoryArgs()` toplam RAM’in %50’sine göre `--max-old-space-size` hesaplar. `start_sandbox()` gerekli ise process’i yeni konteynıra taşır; değilse gerekirse Node yeniden başlatılır.
6. **Önceden OAuth:** `LOGIN_WITH_GOOGLE` + “browser suppress” kombinasyonunda Ink UI açılmadan `getOauthClient()` çağrılır ki link kopyalanabilsin.
7. **Zed/Non-Interactive yollar:** `config.getExperimentalZedIntegration()` aktifse CLI yerine Zed entegrasyonu döner. `config.isInteractive()` false ise stdin’den prompt okunur, `logUserPrompt()` tetiklenir ve `runNonInteractive()` akışı çalışır.
8. **startInteractiveUI:** TTY/interactive durumda `startInteractiveUI(config, settings, startupWarnings, workspaceRoot)` UI render’ını başlatır. `startupWarnings` hem sistem kontrollerinden hem user-level uyarılardan toplanır.

---

## 2. UI Orkestrasyonu (Ink Katmanı)

### 2.1 `startInteractiveUI` (`packages/cli/src/gemini.tsx:129-199`)
- Kitty klavye protokolü otomatik denenir, pencere başlığı workspace adına ayarlanır.
- Tam ekran TUI deneyimi için ekran temizlenir; Ink `render()` çağrısı `SettingsContext.Provider` + `AppWrapper` ile yapılır.
- Güncelleme denetimi (`checkForUpdates → handleAutoUpdate`) arka planda çalışır. `registerCleanup()` Ink instance’ını unmount eder.
- Çıkış/hatada terminalin temizlenmesi için `restoreTerminal()` `exit/SIGINT/SIGTERM/uncaughtException/unhandledRejection` olaylarına bağlanır.

### 2.2 `AppWrapper` (`packages/cli/src/ui/App.tsx:140-158`)
```
KeypressProvider (kitty/paste workarounds, debug logging)
  └─ SessionStatsProvider (prompt sayaçları, token limitleri)
     └─ VimModeProvider (InputPrompt için modal edit keymap’i)
        └─ <App ... />
```

### 2.3 `App` bileşeni (yaklaşık 1.5K satır)
- **Durum & Hook orkestrasyonu:** `useHistory`, `useConsoleMessages`, `useMessageQueue`, `useGeminiStream`, `useDialogClose`, `useThemeCommand`, `useAuthCommand`, `useSettingsCommand`, `useFolderTrust`, `useWelcomeBack`, `useWorkspaceMigration`, `useAutoAcceptIndicator`, `useLoadingIndicator`, `useVisionAutoSwitch`, `useQwenAuth`, `useGitBranchName`, `useKittyKeyboardProtocol`, `useKeypress`, `useVim`, `useBracketedPaste` vb. Tek bileşen içinde tüm UI durumları tutulur.
- **Static/Pending Bölmesi:** `Static` geçmiş kısmını “freeze” ederek performans sağlıyor; en son mesajlar `pendingHistoryItems` üzerinden dinamik render ediliyor (Claude Code benzeri üst/alt ayrımı).
- **Dialog Matrisi:** Theme/Auth/Settings/FolderTrust/ModelSwitch/WelcomeBack/Privacy/Quit/ShellConfirmation diyalogları aynı komponentte koordine ediliyor. `useDialogClose` açık diyalog durumlarını tek yerden kapatma yeteneği sağlıyor.
- **Indicatorlar:** `LoadingIndicator` düşünce ve phrase’leri gösteriyor; `AutoAcceptIndicator`, `ShellModeIndicator`, `UpdateNotification`, `ShowMoreLines`, `Footer` vs. streaming state’e göre açılıp kapanıyor.
- **Input Buffer & Vim:** `useTextBuffer` InputPrompt’u yönetiyor; `useVim` ile modal edit, `useBracketedPaste` ile güvenli kopyala-yapıştır sağlanıyor.

---

## 3. Mesaj Yaşam Döngüsü ve Kuyruk Yönetimi

1. **InputPrompt → `handleFinalSubmit`:** Kullanıcı Enter’a bastığında metin `handleFinalSubmit` üzerinden `useMessageQueue.addMessage()`’e gider (`packages/cli/src/ui/App.tsx:793-799`). Bu aşamada hiçbir komut doğrudan modele gitmez.
2. **Kuyruğun Görselleştirilmesi:** `MAX_DISPLAYED_QUEUED_MESSAGES = 3` ile loading indicator altında önizleme yapılır, fazlası “…(+N more)” etiketiyle gösterilir (`App.tsx:1345-1393`).
3. **Cancel Davranışı:** ESC/Ctrl+C, aktif tool varsa yalnızca prompt’u temizler; değilse `getQueuedMessagesText()` + son kullanıcı mesajı Input buffer’a geri yüklenir (`App.tsx:765-790`).
4. **`useMessageQueue` Hook’u:** Kuyruktaki tüm mesajlar streaming `Idle` olunca `submitQuery()` ile tek bir blok halinde gönderilir; bu sayede model cevap üretirken kullanıcı yeni komutlar verebilir (`packages/cli/src/ui/hooks/useMessageQueue.ts`).
5. **Slash/@ Komutları:** `useGeminiStream.prepareQueryForGemini()` slash komutlarını (`/theme`, `/quit`, `/bug`, `/auth` vs) `useSlashCommandProcessor` aracılığıyla çözer, gerekirse tool planlaması yapar. `@` komutları (ör. `@open`, `@run`) `handleAtCommand()`’a delege edilir; bu fonksiyon önce command’i işler, ardından kullanıcı mesajını geçmişe yazar (`useGeminiStream.ts:268-375`).
6. **Shell Modu:** `useShellCommandProcessor` `sh`/`bash` stilindeki girdileri `SHELL_COMMAND_NAME` tool’u olarak gösterir, stdout/stderr/binary output’u throttled günceller, bitince sonucu gemini geçmişine yazar (`packages/cli/src/ui/hooks/shellCommandProcessor.ts`).
7. **Vision Auto-Switch:** Girdi image parçaları içeriyorsa `useVisionAutoSwitch` prompt’u durdurup model/oturum seviyesinde vision model seçimini kullanıcıya sorar; sonuç `handleVisionSwitch()` ile `submitQuery` akışına geri verilir.

---

## 4. Streaming, Tool Scheduler ve Durum Makinesi

- **`useGeminiStream` Ana Görevi (`packages/cli/src/ui/hooks/useGeminiStream.ts`):**  
  - Abort controller, prompt kimliği (`config.getSessionId()` + prompt count), `turnCancelledRef` ve telemetry logger’ı kurar.  
  - `useReactToolScheduler` (CoreToolScheduler wrapper’ı) ile tool çağrılarını izler; tool durumları `tool_group` history item’lerine çevrilir (`mapTrackedToolCallsToDisplay`).  
  - `StreamingState` hesaplaması, aktif cevap + tool bekleyenleri göz önüne alarak UI’ye “Responding / WaitingForConfirmation / Idle” durumlarını bildirir.
- **Server Event Ağı:** `processGeminiStreamEvents()` `GeminiEvent` akışını döngüyle işler. `Content` event’leri `Static` performansı için güvenli split noktalarında bölünür; `Thought` event’i `LoadingIndicator`’a gider; `ToolCallRequest` biriktirilip stream sonunda `scheduleToolCalls()` ile planlanır; `Finished`, `MaxSessionTurns`, `SessionTokenLimitExceeded`, `ChatCompressed`, `LoopDetected` gibi özel event’ler history’ye bilgi mesajları yazar.
- **Tool Yaşam Döngüsü:**  
  1. Model `ToolCallRequest` yayınlar.  
  2. `scheduleToolCalls()` istekleri CoreToolScheduler’a yollar; orada `validating → awaiting_approval → executing → success/error/cancelled` durumları döner.  
  3. `OutputUpdateHandler` canlı shell output benzeri chunk’ları `pendingHistoryItem`’a basar.  
  4. Tüm araçlar tamamlandığında `handleCompletedTools()` tool cevaplarını PartListUnion’a çevirip `submitQuery({isContinuation: true})` ile modele geri gönderir.  
  5. Kullanıcı onayı gerekiyorsa UI `StreamingState.WaitingForConfirmation` olur ve ToolCall kartları `confirmationDetails` içerir.
- **İptal & Retry:** ESC `cancelOngoingRequest()`’i tetikler; aktif tool durumları `ToolCallStatus.*`’a göre `Canceled` yapılır, `logApiCancel()` telemetriye düşer. Retry event’i için kancalar hazırlanmış, fakat logic TODO olarak işaretli (ileride doldurulabilir).

---

## 5. Sandbox, Bellek, OAuth ve Güvenlik Kancaları

- **Sandbox Yeniden Başlatma:** `start_sandbox()` Docker/Podman tabanlı korumalı ortamı başlatır. Sandbox’tan önce stdin verisi prompt bayraklarına enjekte edilir; auth seçimi dışarıda tamamlanır ki web redirect bozulmasın (`packages/cli/src/gemini.tsx:250-330`).
- **Bellek Otomasyonu:** `advanced.autoConfigureMemory` açıksa `getNodeMemoryArgs()` toplam RAM’in %50’sini max-old-space olarak belirler; CLI sandbox dışında çalışıyorsa process’i yeni argümanlarla relaunch eder.
- **Folder Trust & Privacy:** `useFolderTrust` workspace imzasını saklar; güvenilmeyen klasörlerde CLI tam yetki vermeden önce onay ister. `PrivacyNotice` ve `SettingsDialog` telemetriyi yönetir.
- **Auth/Audit:** `useQwenAuth`, `useAuthCommand`, `validateAuthMethod`, `config.refreshAuth()` OAuth ve token yenileme işlerinin UI tarafındaki kancalarıdır. CLI “external auth” modunda ise sandbox içinde benzer doğrulamalar atlanır.
- **Session & Token Limitleri:** `useSessionStats` turn sayısını ve token limitlerini izler; server `SessionTokenLimitExceeded` etkinliği aldığında kullanıcıya `/compress`/`/clear` önerileri sunulur.

---

## 6. Telemetry, Logging ve Geri Kazanım

- **logUserPrompt / logConversationFinishedEvent:** Her query öncesi telemetriye prompt içeriği, kimliği ve auth tipi gönderilir. YOLO modunda stream idle olduğunda oturum bitişi loglanır.
- **ConsolePatcher & Debug Konsolu:** stdout/stderr intercept edilip Ink üst panelindeki Console sekmesine yönlendirilir. `AppEvent.LogError`/`AppEvent.OpenDebugConsole` hatalarda debug penceresini otomatik açar (`setupUnhandledRejectionHandler()`).
- **Update & Versioning:** `checkForUpdates` sonuçları `UpdateNotification` bileşeninde gösterilir; `setUpdateHandler` App state’ine update bilgisi düşer. `getCliVersion()` nightly olup olmadığını UI’ye bildirir.
- **Cleanup & Exit:** `registerCleanup()` (cleanup.ts) aktif render’ı, patch’leri ve terminali normalize eder; `cleanupCheckpoints()` hatalı süreçlerden kalan dosyaları temizler.

---

## 7. Genişletme Kontrol Listesi

1. **Yeni Slash Komutu:** `useSlashCommandProcessor.ts`’ye yeni komutu ekleyin, `useGeminiStream.prepareQueryForGemini()` sonuçlarını nasıl ele alacağını belirleyin (UI-only mi yoksa `submit_prompt` mu dönecek?). Gerekiyorsa `App` içinde dialog/indicator ekleyin.
2. **Yeni Tool / Executor:** `@qwen-code/qwen-code-core` tarafında tool tanımını yaptığınızda, CLI tarafında özel UI gerekiyorsa `useReactToolScheduler.mapToDisplay()`’e render mantığı ekleyin; shell benzeri durumlar için `useShellCommandProcessor` iyi bir örnek.
3. **Yeni Dialog veya Context:** Dialog state’lerini `App`’e eklerken `useDialogClose` ve `registerCleanup` ile entegre edin; Keypress/Vim context’lerine ihtiyaç varsa `AppWrapper` seviyesinde sağlayın.
4. **Auth/Sandbox Uzantıları:** Yeni auth tipi eklerken `validateAuthMethod`, `config.refreshAuth`, `useAuthCommand`, `packages/cli/src/config/auth.ts` zincirini güncelleyin; sandbox davranışı için `start_sandbox` ve `injectStdinIntoArgs` fonksiyonlarını gözden geçirin.
5. **Telemetry & Logging:** Yeni önemli olaylar için `log*Event` API’lerini kullanın ve `AppEvent` bus’una gerekli eklemeyi yapın; stdout/stderr’ye doğrudan yazmak yerine `ConsolePatcher` ile uyumlu davranın.
6. **Testler:**  
   - UI davranışı: `packages/cli/src/ui/App.test.tsx` ve ilgili hook testlerini genişletin.  
   - Tool scheduler: `useToolScheduler.test.ts` ve `shellCommandProcessor.test.ts`.  
   - Entegrasyon: `integration-tests` altındaki vitest senaryoları sandbox modlarıyla koşuyor; yeni akışlar için smoke test ekleyin.

Bu yapı taşları sayesinde CLI’yi baştan sona izlemek, hata ayıklamak veya yeni yetenekler eklemek çok daha kolay olacaktır. File path referansları ve hook ilişkileri değiştikçe bu rehberi güncelleyerek katkıcıların projeye giriş eşiğini düşük tutabilirsiniz.
