# KEM 插件模板 · SvelteKit

这是一个 KEM API v1 市场窗口插件。首页是用 Svelte 5、TypeScript 和 Skeleton 编写的计数器。开发时使用 SvelteKit 路由和热更新，发布时将同一个首页预渲染为可离线交互的 HTML。

## 本地开发

使用 Node.js 24 和 `package.json` 指定的 pnpm 版本，在项目根目录运行：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

| 要修改的内容 | 文件 |
| --- | --- |
| 插件页面、交互和页面标题 | `src/routes/+page.svelte` |
| 全局样式、Skeleton 主题 | `src/routes/layout.css`、`src/routes/themes/rem.css` |
| 文档语言和当前主题名 | `src/app.html` |
| 插件标识、市场标题、窗口标签及入口 | `package.json` 的 `kem` 字段 |
| KEM Host 端逻辑 | `host.mjs`，纯界面插件可保留空的默认导出 |

## 构建和验收

```sh
pnpm run check
pnpm test
pnpm run build
pnpm preview
```

`pnpm test` 使用 Chromium 运行组件测试，并检查生产预览和发布 HTML 在沙箱中的交互。首次运行需要下载测试浏览器。

`pnpm run build` 使用 `adapter-static` 生成静态站点。SvelteKit 将首页的脚本和样式内联，打包脚本检查 2 MiB 大小上限，并将窗口写入 `dist/index.html`。KEM 只读取这一个 HTML，页面所在地址由宿主临时分配。通过模块导入本地图片或字体，使资源随 HTML 一起内联。`static/` 下的独立文件、CDN 和服务端接口在插件窗口中不可用。

## 创建和发布插件

1. 在 `package.json` 中设置 npm 包名、版本、作者和描述。将 `kem.id` 换成自己的唯一标识，以小写字母开头，可含小写字母、数字和连字符，最长 64 个字符。更新 `kem.title`、`kem.description` 和 `kem.client.label`。
2. 运行 `pnpm pack`。它会重新构建，并把 `dist/index.html` 和 `host.mjs` 连同包清单、README 打进 `.tgz`。安装端可直接加载成品。
3. 准备发布时，移除 `private: true`，将包发布到目标 npm registry，再将对应包名和版本加入 KEM 市场索引。
