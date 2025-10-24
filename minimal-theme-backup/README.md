# Minimal Theme Backup

Bu klasör, Qwen Code projesinin minimal layout sistemine ait tüm bileşenlerin yedeğini içerir.

## Dosya Yapısı

### Temel Minimal Bileşenler
- **`CompactHeader.tsx`** - Tool çağrılarının başlık kısmını gösterir (status icon, tool name, target)
- **`MinimalToolMessage.tsx`** - Tekil tool mesajlarını formatlar (compact header + content)
- **`MinimalToolGroup.tsx`** - Birden fazla tool çağrısını gruplar (spacing düzeltmesi içerir)

### Ek Minimal Bileşenler
- **`ExpandableFooter.tsx`** - Tool sonuçlarını genişletmek/küçültmek için footer
- **`TreeView.tsx`** - Dosya hiyerarşisi ve tree gösterimi için

## Özellikler

### Spacing Çözümü
`MinimalToolGroup.tsx`'de `marginBottom={0}` ayarı sayesinde tutarlı 1 satır boşluk sağlanır:
- LLM → Tool: 1 satır boşluk (HistoryItemDisplay `marginTop={1}`)
- Tool → Tool: 1 satır boşluk (sadece kutu spacing'i)

### Kullanım
Bu dosyalar `packages/cli/src/ui/components/minimal/` klasöründe bulunmalı ve UI kodu tarafından import edilmelidir.

## Tarih
Oluşturulma: 23 Ekim 2025
Amaç: Yanlışlıkla silinen minimal layout sistemini yedeklemek