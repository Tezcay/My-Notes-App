# My Notes App (Web 个人笔记管理系统)

一个基于原生 HTML5、CSS3 和 JavaScript 开发的现代化个人笔记管理单页应用 (SPA)。即开即用，支持 PWA 离线访问。

## ✨ 核心亮点

- **原生极简**：零依赖框架 (No-Framework)，仅使用 Vanilla JS 实现复杂交互，体积小，性能高。
- **三栏布局**：经典“分类-列表-编辑器”设计，提供类似 Notion/Obsidian 的沉浸式写作体验。
- **离线可用 (PWA)**：支持安装到桌面，断网环境下依然可以查看和编辑笔记。
- **Markdown 支持**：集成实时预览、代码高亮、图片粘贴等富文本功能。

## 🚀 功能特性

### 基础功能

- **笔记管理**：创建、编辑、删除笔记，自动保存 (Auto-Save)。
- **分类归档**：无限新建文件夹，支持将笔记拖拽归档。
- **全局搜索**：支持标题和内容的关键词搜索，搜索结果实时高亮。
- **回收站**：防误删机制，删除的笔记暂存至回收站，可一键恢复或永久粉碎。

### 进阶功能

- **🔐 私密空间**：设置访问密码，将敏感笔记加密隔离。
- **🌙 夜间模式**：支持一键切换深色/浅色主题，保护视力。
- **🖱️ 拖拽排序**：支持拖拽调整文件夹顺序，拖拽笔记到分类。
- **📱 响应式设计**：完美适配移动端，支持侧边栏抽屉手势，提供类 Native App 体验。
- **📤 数据备份**：支持将所有数据导出为 JSON 备份，并支持从文件恢复。

## 🛠️ 技术栈

- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage (数据持久化)
- **PWA**: Service Worker, Web App Manifest
- **Libs**:
  - [EasyMDE](https://github.com/Ionaru/easy-markdown-editor) (Markdown 编辑器)
  - [FontAwesome](https://fontawesome.com/) (图标库)
  - [Marked.js](https://github.com/markedjs/marked) (Markdown 解析)

## 📦 安装与使用

由于本项目也是一个 **PWA (Progressive Web App)**，你可以直接在浏览器打开使用，也可以安装为离线应用。

### 方法 1：直接运行 (推荐)

1.  下载本项目源代码。
2.  直接双击打开 `index.html` (部分 PWA 功能可能受限于 `file://` 协议)。
3.  **推荐方式**：使用 VS Code 的 "Live Server" 插件或 Python 启动本地服务：
    ```bash
    # Python 3
    python -m http.server 8000
    ```
    然后在浏览器访问 `http://localhost:8000`。

### 方法 2：安装到桌面

1.  在 Chrome/Edge 浏览器中打开本项目。
2.  点击地址栏右侧的 **"安装应用"** 图标（或在菜单中选择“安装到.../添加到主屏幕”）。
3.  即可像原生 App 一样独立运行。

## 📂 项目结构

```text
My-Notes-App/
├── index.html          # 入口文件
├── manifest.json       # PWA 配置文件
├── styles/
│   └── styles.css      # 全局样式与响应式布局
├── scripts/
│   ├── Main.js         # 入口逻辑与事件绑定
│   ├── Data.js         # 数据层 (CRUD & LocalStorage)
│   ├── UI.js           # 视图渲染与 DOM 操作
│   ├── Editor.js       # Markdown 编辑器配置
│   ├── Advanced.js     # 高级功能 (私密/备份/右键菜单)
│   ├── Utils.js        # 工具函数
│   └── ServiceWorker.js # PWA 离线缓存逻辑
└── assets/             # 静态资源 (图标等)
```

## 📄 License

This project is licensed under the [MIT License](LICENSE).
