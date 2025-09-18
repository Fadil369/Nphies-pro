# Bilingual UI Snippets (Arabic-first)

Labels (ar → en)
- "نسبة القبول من أول محاولة" → "First-Pass Acceptance Rate"
- "عدد الرفض" → "Rejection Count"
- "مبلغ الرفض (ريال)" → "Rejection Amount (SAR)"
- "أعلى أسباب الرفض" → "Top Denial Reasons"
- "صلاحية التغطية" → "Coverage Eligibility"
- "تفويض مسبق" → "Pre-Authorization"

Sample KPI Tile (JSON config)
```json
{
  "id": "rejection_amount",
  "label": { "ar": "مبلغ الرفض (ريال)", "en": "Rejection Amount (SAR)" },
  "format": "currency",
  "rtl": true,
  "brandColors": ["#1a365d", "#2b6cb8", "#0ea5e9"]
}
```

Accessibility
- Direction: dir="rtl" by default; toggle to "ltr" for English
- Fonts: IBM Plex Sans Arabic (ar), Inter (en)
- Color contrast: WCAG 2.1 AA compliant palettes