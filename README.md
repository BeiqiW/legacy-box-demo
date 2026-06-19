# Legacy Box · 陈氏家族传承档案

> 单家族私有传承档案站。Next.js 14 + SQLite，开箱即用，单机部署。

这是 **Legacy Labs** 为单一家族客户打造的「传家盒子」内置网站，可独立运行在任何家庭服务器、NAS、VPS 或本地机器上。所有家族数据保存在本地 SQLite 文件中，不依赖任何第三方云服务。

---

## 1. 快速启动

```bash
# 1. 安装依赖（Node.js ≥ 18）
npm install

# 2. 启动开发服务器（默认端口 3000，可改）
npm run dev

# 或者使用脚本（含自动种子）
bash run.sh
```

打开 [http://localhost:3000](http://localhost:3000)。

### 默认账号

| 角色 | 用户名 | 密码 | 权限 |
|---|---|---|---|
| **管理员** | `admin` | `admin123` | 全部内容增删改查 + 审核 + 用户管理 |
| **家族成员** | `family` | `family123` | 浏览家族内容 · 个人卷宗 · 贡献家族内容（部分需审核） |
| **访客** | — | — | 仅浏览公开页面 |

**生产环境务必修改默认密码。** 可通过 `/admin/users` 或 `scripts/seed.js` 修改。

---

## 2. 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Next.js 14 (App Router) |
| UI | React 18 · Tailwind CSS · 自定义 CSS |
| 数据库 | SQLite (`better-sqlite3`) — 单文件 |
| 认证 | bcryptjs + httpOnly cookie (jose JWT) |
| 字体 | Cormorant Garamond · Inter · Noto Serif SC |
| 部署 | 任意 Node.js 18+ 环境；可选 Cloudflare Tunnel 公网 |

---

## 3. 目录结构

```
legacy-box-demo/
├── app/                      # Next.js App Router 路由
│   ├── page.jsx              # 首页
│   ├── people/               # 人物志（索引 + 详情）
│   ├── family-tree/          # 家族族谱图
│   ├── timeline/             # 家族时间线
│   ├── archive/              # 公开档案馆
│   ├── oral-history/         # 口述历史
│   ├── about/                # 关于家族
│   ├── login/                # 登录页
│   ├── my/                   # 「我的卷宗」家族成员后台
│   │   ├── page.jsx          #   - 总览
│   │   ├── milestones/       #   - 生平时刻（个人）
│   │   ├── personal/         #   - 个人记述（私密）
│   │   ├── files/            #   - 我的档案（私密文件，任意格式）
│   │   ├── timeline/         #   - 家族时间线（贡献，需审核）
│   │   ├── archive/          #   - 家族档案库（贡献，任意格式）
│   │   └── oral-history/     #   - 家族口述贡献
│   ├── admin/                # 管理员后台
│   │   ├── page.jsx          #   - 总览
│   │   ├── review/           #   - 审核队列
│   │   ├── people/           #   - 人物管理
│   │   ├── timeline/         #   - 时间线管理
│   │   ├── archive/          #   - 档案管理（含贡献者+展示位置）
│   │   ├── oral-history/     #   - 口述管理
│   │   └── users/            #   - 用户管理
│   └── api/                  # 后端 API Routes
│       ├── auth/login        #   - 登录
│       ├── auth/logout       #   - 登出
│       ├── admin/[table]     #   - 通用 admin CRUD（白名单表/字段）
│       ├── admin/review      #   - 审核动作
│       ├── admin/upload      #   - 文件上传
│       ├── my/[table]        #   - 家族成员 CRUD（受 owner 约束）
│       └── files/[filename]  #   - 鉴权文件下载
├── components/               # 共享 React 组件
│   ├── Nav.jsx               # 顶部导航 + 登录态
│   ├── Footer.jsx
│   ├── AdminLayout.jsx       # admin 后台外壳
│   ├── AdminTable.jsx        # 通用 admin 表格（增删改查）
│   ├── MyLayout.jsx          # 「我的卷宗」外壳
│   ├── MyTable.jsx           # 通用家族成员表格
│   ├── ReviewQueue.jsx       # 审核队列
│   └── ...
├── lib/
│   ├── db.js                 # SQLite 初始化 + 自动迁移
│   └── auth.js               # 鉴权工具（getCurrentUser, requireRole）
├── scripts/
│   └── seed.js               # 种子数据脚本（陈氏家族示例）
├── data/
│   ├── legacy.db             # SQLite 主数据库（含示例数据）
│   └── uploads/              # 用户上传文件
├── public/
│   └── downloads/            # 可下载的静态资源
├── next.config.js
├── tailwind.config.js
├── package.json
├── run.sh                    # 一键启动脚本
└── README.md
```

---

## 4. 数据模型

### 表清单

| 表 | 用途 |
|---|---|
| `users` | 账号（admin / member） |
| `people` | 家族人物 |
| `milestones` | 生平时刻 / 成就（kind: milestone / achievement） |
| `timeline_events` | 家族时间线事件（含审核字段） |
| `archive_items` | 档案条目（照片/文件/视频/录音，任意格式） |
| `oral_histories` | 口述历史录音 / 文字 |
| `personal_entries` | 个人记述（私密日记式） |
| `pages` | 单页内容（关于/家训等） |

### 关键字段约定

通用字段（多数表都有）：

- `owner_user_id` — 创建者（用于「我的卷宗」筛选）
- `visibility` — `public` / `member` / `private`
- `approval_status` — `draft` / `pending` / `approved` / `rejected`
- `published_to_main` — 是否在公开页面（如 `/archive`）显示
- `person_id` — 关联到 `people` 表的某个人物
- `created_at` / `updated_at`

### 自动迁移

`lib/db.js` 启动时会自动 `CREATE TABLE IF NOT EXISTS ...` + `ALTER TABLE ADD COLUMN` 补字段。不需要 migrations 工具链。

---

## 5. 权限矩阵

| 操作 | 访客 | 家族成员 | 管理员 |
|---|:---:|:---:|:---:|
| 浏览公开页面 (`/people` `/family-tree` `/timeline` `/archive` 等) | ✓ | ✓ | ✓ |
| 浏览 `visibility=member` 内容 | ✗ | ✓ | ✓ |
| 「我的卷宗」`/my` | ✗ | ✓ | ✓ |
| 创建个人内容（生平时刻 / 个人记述 / 我的档案） | ✗ | ✓ | ✓ |
| 贡献家族时间线（需审核） | ✗ | ✓ | ✓（自动通过）|
| 贡献家族档案库 / 口述历史 | ✗ | ✓ | ✓ |
| 「管理后台」`/admin` | ✗ | ✗ | ✓ |
| 审核 / 拒绝待审条目 | ✗ | ✗ | ✓ |
| 用户管理 | ✗ | ✗ | ✓ |

---

## 6. 三种内容流

```
个人内容（owner 私有）  ──┐
                          ├──→ /my/* 个人区
家族共享（需审核）  ──────┼──→ /my/* 共享区 → 审核 → /timeline 等公开页
                          │
官方内容（admin 直接发）──┴──→ /admin/* → 公开页
```

### 1. 个人内容
`milestones` / `personal_entries` / `archive_items (visibility=private)`
仅创建者可见，无需审核。

### 2. 家族共享内容
`timeline_events`（必审）/ `archive_items (visibility=member, published_to_main=1)`（自动）
管理员可在 `/admin/review` 审核。

### 3. 官方内容
管理员通过 `/admin/*` 直接增删改，立即生效。

---

## 7. 上传与文件存储

- 上传 API：`POST /api/admin/upload`（admin / member 均可）
- 接受任意 MIME 类型；体积限制由 `next.config.js` 中 `serverActions.bodySizeLimit` 控制（默认 50 MB）
- 文件保存到 `data/uploads/<sha256>.<ext>`，DB 只存路径
- 下载：`GET /api/files/<filename>` —— 鉴权后流式返回
  - `visibility=public` → 任何人可下
  - `visibility=member` → 仅登录用户
  - `visibility=private` → 仅 owner 与 admin

---

## 8. 公网暴露（可选）

### Cloudflare Quick Tunnel（临时）

```bash
cloudflared tunnel --url http://localhost:3000
# 输出形如 https://random-name.trycloudflare.com 的临时域名
```

**注意**：临时域名每次重启都换，不可恢复。生产请用 **Named Tunnel** 或独立反代。

### Nginx 反代示例

```nginx
server {
  listen 80;
  server_name family.example.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

### PM2 守护进程

```bash
npm run build
pm2 start npm --name legacy-box -- start
pm2 save
pm2 startup
```

---

## 9. 生产部署清单

- [ ] 修改 `admin` / `family` 默认密码
- [ ] 在 `lib/auth.js` 修改 JWT_SECRET（环境变量 `LEGACY_JWT_SECRET`）
- [ ] 配置 HTTPS（反代或 Cloudflare）
- [ ] 定期备份 `data/legacy.db` + `data/uploads/`（推荐 rclone → 加密对象存储）
- [ ] 调整 `next.config.js` 中 `bodySizeLimit` 到合适值
- [ ] 关闭 dev 模式：使用 `npm run build && npm start`
- [ ] 监控：cron `wget -q -O /dev/null http://localhost:3000/` 或接入 uptime kuma

---

## 10. 二次开发指南

### 新增一个页面

1. 在 `app/` 下新建目录与 `page.jsx`
2. 用 `getCurrentUser()` 从 `lib/auth.js` 拿当前用户
3. 直接用 `Database` 查询（不必走 API），因为 RSC 默认 server-side

### 新增一种内容类型

1. 在 `lib/db.js` 的 `migrate()` 加表与字段
2. `app/api/admin/[table]/route.js` 的 `ALLOWED_TABLES` 加白名单
3. `components/AdminTable.jsx` 不需要改 —— 它是通用表格
4. 在 `/my/*` 或 `/admin/*` 新建对应页面引用 `<MyTable>` / `<AdminTable>`

### 修改主题色

`tailwind.config.js` + `app/globals.css` 顶部 CSS 变量。

---

## 11. 已知限制

- 单机 SQLite，**不适合多节点**（家族网站本身不需要）
- 上传文件未加密（依赖磁盘加密或 LUKS）
- 没有内置邮件通知；审核队列需要管理员主动查看
- 暂无 i18n 框架；当前所有文案中文为主

---

## 12. 联系与交接

- **设计与初版实现**：Legacy Labs · ◈ Legacy Architect
- **下一步开发建议**：
  - 加全文搜索（SQLite FTS5 即可）
  - 加 PDF / 视频在线预览
  - 加家族族谱可视化编辑器
  - 加多语言（i18n 路由）
  - 接入 AI（自动转写口述、自动提取关键事件、AI 摘要）
  - 真实 SSO / 邮件登录 / Magic Link

---

© Legacy Labs · 单家族部署示例 · 任何代码可由接手方修改与商用
