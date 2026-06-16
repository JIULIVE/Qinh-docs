# 秦淮系列文档站（web）

基于 [VitePress](https://vitepress.dev/) 的秦淮系列多插件官方文档站，中英双语，部署到 GitHub Pages。

```
web/
├─ package.json                    # 依赖与脚本
├─ .github/workflows/deploy.yml    # 推送后自动构建并发布
└─ docs/
   ├─ .vitepress/config.mts        # 站点配置(主题/导航/侧边栏/双语)
   ├─ index.md                     # 中文首页(home 布局)
   ├─ QI/  QCL/  QS/ …             # 各插件中文文档(QI 全量、QCL 全量、其余占位)
   └─ en/                          # 英文文档(与中文同结构的平行树)
      ├─ index.md
      └─ QI/  QCL/ …
```

## 中英双语怎么工作

- VitePress i18n：**中文在根目录**，**英文在 `docs/en/` 平行目录**。
- 右上角语言菜单切换 中文 / English。
- 给某页加英文：在 `docs/en/` 下对应路径放同名 `.md` 即可。

## 顶部导航 / 侧边栏

都在 `docs/.vitepress/config.mts` 里用一份「文档树」数据生成（中英共用结构、各自标签）。新增插件：在 `docs/` 与 `docs/en/` 下建文件夹，并在 config 的 `PLUGINS` / `STUBS` 里加一项。

## 本地预览

需要 Node 18+。在本目录执行：

```bash
npm install
npm run dev
```

打开终端给出的地址（默认 http://localhost:5173 ），改 `docs/` 里的 md 自动热刷新。
构建产物预览：`npm run build` 然后 `npm run preview`。

## 发布到 GitHub Pages

本地无需额外操作，GitHub 云端自动构建：

1. GitHub 新建空仓库（如 `Qinh-docs`），不要勾自动生成 README。
2. 在本目录执行（首次）：

   ```bash
   git init
   git add .
   git commit -m "init qinh docs site"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
3. 仓库 **Settings → Pages → Build and deployment**，**Source** 选 **GitHub Actions**。
4. 等 **Actions** 里 “Deploy Qinh Docs (VitePress)” 跑完（约 1–2 分钟），网址即
   `https://<你的用户名>.github.io/<仓库名>/`。

> 站点子路径（`base`）由工作流按仓库名自动设置。若改用**自定义域名**或 **`<用户名>.github.io` 主页仓库**，请把 `deploy.yml` 里的 `BASE_PATH` 改成 `/`。

以后改完文档：`git add . && git commit -m "更新" && git push`，一两分钟后线上自动更新。
