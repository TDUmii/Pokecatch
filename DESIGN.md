---
name: PokéCatch của Umi
description: Game Pokémon cá nhân với thế giới pixel kế thừa và tiện ích offline tiếng Việt.
colors:
  primary: "#f3cb53"
  primary-hover: "#ffe18b"
  game-yellow: "#ffcb05"
  game-bg: "#141826"
  game-panel: "#1c2030"
  game-panel-raised: "#252a3d"
  game-text: "#eef1f8"
  game-muted: "#9aa3bb"
  utility-panel: "#202336"
  utility-text: "#edf0fa"
  utility-secondary: "#d0d8ee"
  utility-muted: "#becae4"
  utility-border: "#626b87"
  utility-button: "#343b55"
  utility-button-hover: "#465374"
  primary-ink: "#242334"
  success: "#a9edc7"
  focus: "#a8dfff"
  link: "#9ddcff"
  danger: "#ff8a8a"
typography:
  game-display:
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif'
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.35
  game-body:
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
  utility-title:
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif'
    fontSize: "23px"
    fontWeight: 750
    lineHeight: 1.25
  utility-body:
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif'
    fontSize: "15px"
    lineHeight: 1.6
  utility-label:
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.3
rounded:
  utility-control: "8px"
  utility-entry: "9px"
  utility-dialog: "15px"
  game-panel: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.utility-control}"
    padding: "10px 14px"
    typography: "{typography.utility-label}"
  button-secondary:
    backgroundColor: "{colors.utility-button}"
    textColor: "#fff"
    rounded: "{rounded.utility-control}"
    padding: "10px 14px"
  offline-dialog:
    backgroundColor: "{colors.utility-panel}"
    textColor: "{colors.utility-text}"
    rounded: "{rounded.utility-dialog}"
    padding: "24px"
---

# Design System: PokéCatch của Umi

## Overview

**Creative North Star: "Hành trình pixel mang theo mình"**

This is a record of the implemented interface, using the established direction in PRODUCT.md. The public Pokecatch VN frontend supplies the dark pixel-game world, Pokémon sprites, scene art, animated battles and dense game navigation. The personal edition adds a compact offline entry and a readable Vietnamese utility dialog. Preserve this division of visual responsibility: game imagery carries the adventure; system text explains local storage and downloads clearly.

The offline addition uses the inherited dark palette with a softer yellow primary action. Its Be Vietnam Pro type supports longer Vietnamese instructions, matching the repaired game typography. It is intentionally quieter than the colorful game underneath.

**Key Characteristics:**

- Dark layered panels with pixel art and region-specific game scenes.
- Yellow action emphasis, light text, muted supporting copy.
- Compact persistent entry opening a focused native dialog.
- Clear Vietnamese labels and truthful download/save status.

## Colors

The normative frontmatter records observed source values. The inherited game has its own accent-rich palette; the offline utility uses a small subset rather than replacing it.

- **Primary:** warm utility yellow marks the full offline download and its progress indicator. Primary ink keeps its label dark and legible.
- **Secondary:** slate buttons handle export, import and dismissal. Cyan links identify attribution and destinations.
- **Neutral:** dark blue panels separate the dialog from the game. Light body text, secondary descriptions and muted hints create a clear reading order. Borders define controls without requiring bright filled backgrounds.
- **Semantic roles:** green is success/readiness; muted text is inactive or supporting status; inherited soft red is danger/error. Download errors currently use the status text rather than a separate red alert component. Do not claim an unimplemented error treatment.

**The Action Hierarchy Rule.** The offline dialog has one full-width yellow download action. Save transfer actions remain a balanced secondary pair.

## Typography

The game and offline utility use self-hosted **Be Vietnam Pro** with regular, medium, semibold, bold and extra-bold faces (400, 500, 600, 700 and 800) in `assets/fonts/`. The shared `bundle/vietnamese-fonts.css` assigns the body, title and former pixel font roles to this family. The Latin brand logo alone retains Jersey 15. Pixel art, scene framing and game imagery retain their inherited identity.

The game type ramp is 11, 12, 14, 16, 18, 22 and 28px. Body text uses medium weight with a line height of 1.5; headings use bold weight with a line height of 1.35. Side navigation labels use 14px and line height 1.35, with semibold navigation buttons. Intro styles and canvas text references also use Be Vietnam Pro and the intro links the shared font stylesheet.

Utility sizes remain distinct: compact 23px title, 15px body, 14px action labels, 12px hints and entry label, and 11px attribution. Section headings retain their warm light-yellow tint. The font repair changes their family while preserving their existing sizing and rhythm.

**The Vietnamese Coverage Rule.** Use the shared self-hosted family for Vietnamese interface text, including intro and canvas text. Do not restore Jersey fonts to Vietnamese text roles. Source font inspection found 50 missing Vietnamese characters in the old Jersey sample; fontTools checks confirmed the five replacement faces cover the full tested Vietnamese precomposed and NFD strings. Browser QA passed at widths 1366, 390 and 360px with no horizontal overflow or JavaScript errors, and verified font loading after an offline reload. Chrome reported all 72 glyphs of the representative Vietnamese text as the custom Be Vietnam Pro face. This is browser evidence, not physical-phone validation.

## Layout

The original game adapts from desktop side navigation and layered game panels to a compact mobile game viewport. The utility is a fixed entry: top right on the title screen, above the mobile bottom navigation during play, and bottom right on desktop (901px and wider). Safe-area offsets keep it away from display cutouts and the device edge.

The dialog is centered with width limited to 450px and 24px total horizontal viewport clearance. It has 24px internal padding, a viewport-aware maximum height and internal scrolling. Sections use 22px vertical padding and thin dividers. Export and import share one row with a 10px gap and equal widths. Buttons have at least 44px height. The close control has at least 40px width.

Review evidence includes desktop and mobile browser screenshots, including a 390px mobile viewport. The offline dialog screenshot is a tall full-page capture; it demonstrates readable narrow layout, not physical-device validation. No claim is made about testing on an actual phone.

## Elevation & Depth

Depth combines tonal layering, borders and shadows. The native dialog darkens the game using an opaque-tinted backdrop; the game remains recognizable behind it. The entry has a compact shadow, and the dialog a larger diffuse shadow. Focus is a clear pale-blue outline (3px with 3px offset). No extra motion is introduced by the utility; reduced-motion styling preserves ordinary scrolling behavior.

## Shapes

The inherited world combines rounded panels with pixel sprites and button treatments. Utility controls use gently rounded corners; the dialog uses a larger radius and a thin visible outline. The entry is a small rounded rectangle with an outline cloud/download icon and a readiness dot. The dot supplements textual download status rather than replacing it.

## Components

### Offline entry

A persistent icon, short label and small state dot open the native dialog. The dot turns green only after offline readiness verification. Preserve its accessible full name and safe-area placement.

### Buttons

Yellow primary, slate secondary and a large close control establish clear roles. Hover brightens the fill. Keyboard focus has the shared visible outline. Disabled download controls lower opacity and use a wait cursor. Export and import remain secondary because they transfer progress rather than start the download.

### Native utility dialog

The heading and close action share a row, followed by a short description. The download section precedes save transfer; attribution follows both. It is a native modal dialog with an accessible title, keyboard dismissal, and a separately labelled close button. Long content scrolls within its viewport limit.

### Download progress and status

A native progress bar appears during download. A polite live status explains counts, completion, missing files and retry actions in Vietnamese. Installation is shown when the browser exposes the install prompt; the iPhone hint remains ordinary instructional text.

### Save transfer

Two equal buttons export and import a JSON save. A hidden file picker opens through the import button. Confirmation is a native browser confirmation. Result text uses a polite live region. Do not visually imply an account, cloud save or multiplayer connection.

### Navigation and game containers

Keep the inherited scene framing, Pokémon art and local game controls. The personal edition removes the original server's community navigation, promotional controls and news feed, retaining only its own project link. Keep source attribution in THIRD_PARTY.md. The utility does not introduce a competing navigation system.

## Do's and Don'ts

### Do:

- **Do** preserve the inherited pixel-game identity and source attribution.
- **Do** keep the offline utility readable in Vietnamese with clear download and local-save language.
- **Do** preserve the single yellow primary action, balanced save pair, visible focus and touch-friendly controls.
- **Do** use textual status alongside the readiness dot and expose failures honestly.
- **Do** distinguish browser viewport review from real-phone validation.

### Don't:

- **Don't** replace inherited pixel art with generic dashboard styling; the authorized Vietnamese font repair preserves that art.
- **Don't** apply the utility's text sizes across the game engine; use the shared game type ramp and preserve utility sizing.
- **Don't** describe unavailable cloud, account or multiplayer features as functional.
- **Don't** treat a tall full-page screenshot as proof that all content fits simultaneously within a phone screen.


## Quà trong Sòng bạc

Giữ nguyên Sòng bạc của engine với máy quay, Pachinko, cách đặt cược và hình ảnh gốc. Không có màn hình hay nút điều hướng Khu quà riêng. Các vật phẩm mới nằm trong ngăn details “Quà của tôi” ngay dưới khung Sòng bạc, mặc định thu gọn; mở ngăn để dùng quà, đổi thưởng, xem lịch sử và trang bị Mega. Vé và lượt miễn phí được máy quay gốc tự dùng, giá trên nút QUAY hiển thị Miễn phí khi có vé.

Phần hỗ trợ `ua-` dùng Be Vietnam Pro cùng nền tối, điểm nhấn vàng/cyan/hồng và các biểu tượng vật phẩm đã có. Nút và select tối thiểu 44px. Lưới lựa chọn và native dialog nhận Pokémon giữ nguyên; cập nhật số lượng không tự mở ngăn quà. Thông tin tỷ lệ và luật trả thưởng của máy gốc vẫn nằm ở phần Tiền thưởng, kèm hướng dẫn không quá hai lượt trượt liên tiếp.

Bằng chứng kiểm tra trình duyệt 390px và 1366px trong `.impeccable/review/casino/`: máy gốc còn nguyên, không có màn hình riêng, giao dịch máy quay/Pachinko trao quà một lần, dữ liệu cũ và bản lưu sau tải lại được giữ. Đây là kiểm tra trình duyệt, không phải điện thoại thật.
