# TieuYeuDuKy Monorepo

Monorepo cho game **TieuYeuDuKy** (RPG Phaser + Capacitor) và config OpenClaw.

## Cấu trúc

```
tieyeducy-monorepo/
├── games/
│   └── tieuyeducy/          # Game TieuYeuDuKy (Phaser + Capacitor Android)
├── config/
│   └── openclaw.json        # OpenClaw Gateway config
├── docs/
│   ├── AGENTS.md            # Workspace rules
│   ├── SOUL.md              # Agent personality
│   ├── IDENTITY.md          # Agent identity
│   ├── USER.md              # User info
│   └── TOOLS.md             # Local tool notes
├── pnpm-workspace.yaml      # pnpm workspace config
└── package.json             # Root package.json
```

## Game TieuYeuDuKy

RPG 2D xây dựng bằng **Phaser 3** + **TypeScript** + **Vite**, đóng gói Android bằng **Capacitor**.

### Chạy development

```bash
# Cài dependencies
pnpm install

# Chạy dev server (Vite + Express backend)
pnpm dev:game

# Build production
pnpm build:game

# Build APK Android
pnpm android:apk
```

### Scripts có sẵn

| Script | Mô tả |
|--------|-------|
| `dev:game` | Chạy Vite dev server + Express backend |
| `build:game` | TypeScript compile + Vite build |
| `android:sync` | Sync Capacitor Android project |
| `android:apk` | Build debug APK |
| `atlas:bbox` | Tính toán bounding box sprite atlas |

## OpenClaw Config

File `config/openclaw.json` chứa cấu hình:
- Models: NVIDIA Nemotron, DeepSeek, Kimi, MiniMax, GLM, Mistral, Llama, Gemma, Granite
- Agents, plugins, channels (Telegram)
- Tool profiles

## Yêu cầu

- Node.js >= 20
- pnpm >= 9
- Android SDK (cho build APK)
- Java 17+ (cho Gradle)

## License

Private - Internal use only.