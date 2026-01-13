# 《Web 程序设计实践》课程报告

|   项目    |        内容        |
| :-------: | :----------------: |
| **院 系** | 计算机与大数据学院 |
| **专 业** |      软件工程      |
| **年 级** |      2022 级       |
| **学 号** |      xxxxxxxx      |
| **姓 名** |       某某某       |

**日期：** 2026 年 1 月 xx 日

---

## 一、 项目概况

### 1.1 项目简介

本次实践课题为“笔记管理系统”，完成了一个简洁、高效的在线笔记管理工具。系统允许用户创建、删除、重命名笔记分类，添加、编辑、删除、搜索笔记，以及通过搜索功能快速找到特定笔记。项目在 32 学时内完成，充分运用了 HTML5、CSS、JavaScript 和 DOM 操作等前端技术。

### 1.2 使用的技术和工具

- **HTML5** ：用于构建网页结构，确保页面的语义化和结构化。
- **CSS** ：用于页面的样式设计，美化页面样式。
- **JavaScript 和 DOM** ：实现页面交互效果，例如表单验证、动态加载列表等。
- **本地存储** ：使用浏览器的 `window.localStorage` 保存笔记分类和笔记数据，实现数据的持久化。

### 1.3 系统增加/扩展的功能有：

- **笔记搜索功能增强** ：增加全文搜索功能，可根据笔记内容、标题和标签进行检索。支持模糊搜索或关键词高亮显示。
- **Markdown 笔记** ：支持 Markdown 作为笔记内容的编辑和实时预览。集成 EasyMDE 库并自定义图片粘贴逻辑。
- **拖拽排序功能** ：利用 HTML5 的 Drag and Drop API，允许用户通过拖拽来重新排序笔记分类，或将笔记拖入文件夹。
- **私密空间** ：支持设置访问密码，将重要笔记移入加密空间保护隐私。
- **待办事项管理** ：独立的待办模块，支持复选框快速标记完成/未完成。
- **笔记备份与恢复** ：支持将所有数据导出为 JSON 文件，或从备份文件恢复。
- **PWA 离线应用** ：支持“安装”到桌面或手机，并利用 Service Worker 实现离线访问。
- **夜间模式** ：实现了夜间模式主题，使用 CSS 变量动态切换。

---

## 二、 系统基础功能的设计与实现

> **提示：**（介绍如何完成任务书所要求的笔记管理系统基础功能的设计、实现，测试、运行等）

### 2.1 数据持久化

#### 1. 实现思路

项目采用 `localStorage` 作为本地数据库。核心策略是：

1.  **加载时**：应用启动时尝试读取 `notes` 和 `categories` 键值。如果为空或解析失败，则加载预设的默认数据，防止应用崩溃。
2.  **更新时**：任何增删改操作（如修改笔记、新建分类）后，立即调用 `saveAllToLocalStorage()` 函数。
3.  **序列化**：使用 `JSON.stringify()` 将 JavaScript 对象转换为字符串存储；读取时使用 `JSON.parse()` 还原。

#### 2. 关键代码

```javascript
// Data.js: 保存所有数据到LocalStorage
function saveAllToLocalStorage() {
  localStorage.setItem("notes", JSON.stringify(notes));
  localStorage.setItem("categories", JSON.stringify(categories));
}

// 初始化逻辑：优先读取本地缓存
try {
  const savedNotes = localStorage.getItem("notes");
  // 如果有数据就解析，没有就使用默认
  notes = savedNotes ? JSON.parse(savedNotes) : defaultNotes;
} catch (error) {
  // 异常处理：数据损坏时回退到默认状态，保证程序可用
  saveAllToLocalStorage();
}
```

#### 3. 数据流向

`User Action` -> `Update JS Object (notes/categories)` -> `saveAllToLocalStorage()` -> `Browser Storage`

### 2.2 用户界面设计（设计与实现）

#### 1. 布局策略

系统采用 **Flexbox（弹性盒子）** 实现经典的三栏式布局，确保在不同屏幕尺寸下的自适应能力。

- **.app (容器)**：`display: flex; height: 100vh;`，占满全屏。
- **.sidebar (侧边栏)**：固定宽度 `250px`，负责导航。
- **.list-view (列表栏)**：固定宽度 `320px`，展示笔记摘要。
- **.editor-view (编辑区)**：`flex: 1`，自动占据剩余空间。

#### 2. 响应式设计

通过 CSS 媒体查询 (`@media`) 适配移动端：

```css
/* styles.css: 移动端适配 */
@media (max-width: 768px) {
  .sidebar {
    /* 抽屉式侧边栏：平时移出屏幕 */
    position: fixed;
    transform: translateX(-100%);
    z-index: 1001;
  }
  .list-view {
    width: 100%; /* 列表在手机上占满全屏 */
  }
  .sidebar.open {
    transform: translateX(0); /* 激活时滑入 */
  }
}
```

### 2.3 用户交互逻辑（设计与实现）

- **笔记分类栏：**

  - **点击事件**：通过事件委托 (`sidebar.addEventListener('click')`) 监听 `.nav-item` 的点击，触发 `switchCategory()` 切换当前试图。
  - **折叠动画**：点击文件夹标题时，通过切换 CSS 类 `.collapsed` 实现平滑的高度变化动画。

- **笔记列表栏：**

  - **搜索交互**：监听输入框的 `input` 事件，实时过滤 `notes` 数组并重新渲染列表。
  - **拖拽排序**：利用 HTML5 Drag API，允许用户拖动笔记项到左侧分类，触发分类变更逻辑。

- **全局快捷键：**
  - **Ctrl + S**：触发保存操作，并显示“已保存”的视觉反馈。
  - **Ctrl + N**：快速新建笔记。
  - **Esc**：关闭弹窗、清除搜索或退出特定模式。

### 2.4 功能实现细节

#### 1. 笔记分类管理

> **提示：** 填写范例：

**(1) 实现思路**
用户点击“+”按钮新建文件夹时，使用自定义模态框 (`showModal`) 获取输入。

1.  **输入验证**：确保文件夹名称不为空。
2.  **数据更新**：生成唯一 ID (`folder-<timestamp>`)，构建对象 push 到 `categories` 数组。
3.  **持久化与渲染**：保存数据并调用 `renderFolderList()` 刷新左侧视图。

**(2) 关键代码 (Main.js)**

```javascript
// 处理新建文件夹
addFolderBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  // 调用封装好的弹窗组件
  showModal("新建文件夹", "请输入文件夹名称", (folderName) => {
    // 生成带前缀的唯一ID
    const newCategory = { id: "folder-" + Date.now(), name: folderName };
    categories.push(newCategory);

    // 更新数据层并刷新UI
    saveAllToLocalStorage();
    renderFolderList();
  });
});
```

**(3) 数据流向**
`User Click (+)` -> `Show Modal` -> `User Input` -> `Create JS Object` -> `Update categories Array` -> `LocalStorage` -> `Update DOM`

关键是要展示出**“逻辑思路 + 关键代码 + 数据流向”**。证明你不仅写出了代码，而且理解代码背后的运行机制。

> **提示：** 代码排版示例：

```javascript
// 创建新任务
createTask(description, status = 'pending') {
  const newTask = {
    id: Date.now(), // 使用时间戳作为任务的唯一ID
    description,
    status
  };
  this.tasks.push(newTask);
  this.saveTasks();
  return newTask;
}
```

**代码要“洗净”**：报告里的代码不需要贴全部，贴最核心的逻辑即可。把无关的 `console.log` 或者复杂的 CSS 类名操作简化一下，加上清晰的注释。

#### 2. 添加笔记

> **提示：** 填写范例：

**(1) 实现思路**
添加笔记分为“新建”和“即时保存”两步。

1.  **归属判断**：根据当前选中的 `currentCategoryId` 决定新笔记属于哪个文件夹。如果是“全部笔记”或“回收站”，则默认归入“未分类”。
2.  **对象构建**：创建包含时间戳 ID、默认标题、空内容的对象。
3.  **UI 响应**：将新笔记插入到 `notes` 数组头部（最新），重新渲染列表，并将焦点定位到标题输入框。

**(2) 核心代码实现 (Main.js)**

```javascript
addNoteBtn.addEventListener("click", () => {
  const newId = String(Date.now());

  // 智能判断新建笔记的归属
  let targetCategoryId = currentCategoryId;
  if (currentCategoryId === "all" || currentCategoryId === "trash") {
    targetCategoryId = "uncategorized";
  }

  const newNote = {
    id: newId,
    title: "新建笔记",
    content: "", // 默认为空
    updateTime: Date.now(),
    categoryId: targetCategoryId,
  };

  notes.unshift(newNote); // 插入到数组最前面
  saveAllToLocalStorage();
  renderNoteList();

  // 立即加载到编辑器并聚焦
  loadNoteToEditor(newNote);
});
```

**(3) 难点与解决**
难点在于**全部分类下的新建逻辑**。用户在查看“全部笔记”时新建，系统无法自动推断归属。解决方案是设定一个默认值（未分类），并在代码中进行显式判断，防止笔记“迷失”在不知名分类中。

#### 3. 编辑笔记

**(1) 实现思路**
编辑器采用了“实时保存”策略（防抖）。

1.  **数据绑定**：监听编辑器的 `input` 或 `change` 事件。
2.  **同步更新**：一旦内容变更，立即找到内存中对应的 `note` 对象更新其 `content` 和 `updateTime`。
3.  **UI 反馈**：同步更新左侧列表中的预览文字和时间，让用户感知到保存成功。

**(2) 关键代码 (Editor.js)**

```javascript
// A. 标题输入监听
editorTitle.addEventListener("input", (e) => {
  if (currentNoteId) {
    const note = notes.find((n) => n.id == currentNoteId);
    if (note) {
      note.title = e.target.value;
      saveAllToLocalStorage();
      // 同步更新列表中的标题显示（局部刷新 DOM，提高性能）
      const activeItem = document.querySelector(
        ".note-item.active .note-title"
      );
      if (activeItem) activeItem.textContent = note.title;
    }
  }
});
```

### 4. 删除笔记 (回收站机制)

**(1) 实现思路**
采用软删除机制，分两步走：

1.  **首次删除**：如果笔记不在回收站，则只修改其 `categoryId` 为 `trash`，这实际上是一次“移动”操作。
2.  **永久删除**：如果笔记已经在回收站（`categoryId === 'trash'`），则从 `notes` 数组中彻底移除 (`splice`)。

**(2) 关键代码 (Main.js)**

```javascript
deleteBtn.addEventListener("click", () => {
  const currentNote = notes.find((n) => n.id == currentNoteId);

  // 情况1: 在回收站中 -> 永久删除
  if (currentNote.categoryId === "trash") {
    if (confirm("确定要永久删除这条笔记吗？")) {
      notes = notes.filter((n) => n.id !== currentNoteId);
      saveAllToLocalStorage();
    }
  }
  // 情况2: 普通删除 -> 移入回收站
  else {
    currentNote.categoryId = "trash";
    saveAllToLocalStorage();
  }
  renderNoteList(); // 刷新列表
});
```

### 5. 搜索笔记

**(1) 实现思路**
搜索功能本质上是前端的数组过滤。

1.  **监听输入**：获取搜索框的 `value`。
2.  **过滤数组**：使用 `Array.prototype.filter`，同时检查 `title` 和 `content` 是否包含关键词（转为小写实现不区分大小写）。
3.  **渲染反馈**：如果结果为空，显示“未搜索到相关笔记”的占位图。

**(2) 关键代码 (UI.js)**

```javascript
// 在 renderNoteList 中过滤
const filteredNotes = notes.filter((note) => {
  // 拼接标题和内容进行全量搜索
  const contentToSearch = (note.title + note.content).toLowerCase();
  const keyword = currentSearchKeyword.toLowerCase();

  // 核心过滤条件
  return contentToSearch.includes(keyword);
});
```

---

## 三、 系统扩展功能的设计与实现

> **提示：**（介绍你在笔记管理系统基础功能基础上完成的可选功能，包括功能及设计与实现方法等， 此部分很重要 ）

### 3.1 笔记搜索功能增强 (关键词高亮)

**(1) 功能描述**
为了提升搜索体验，不仅过滤出笔记，还在列表中将匹配的关键词标红/加粗显示。

**(2) 实现方法**
编写 `highlightText` 工具函数，利用正则表达式 (`RegExp`) 动态匹配关键词，并包裹 `<span style="color:green">` 标签。

```javascript
// Utils.js: 关键词高亮
function highlightText(text, keyword) {
  if (!keyword) return text;
  // gi: 全局匹配 + 忽略大小写
  const regex = new RegExp(`(${keyword})`, "gi");
  // 替换为带样式的 HTML
  return text.replace(
    regex,
    '<span style="color: #10B981; font-weight: bold;">$1</span>'
  );
}
```

### 3.2 Markdown 编辑器集成

**(1) 功能描述**
引入 `EasyMDE` 库，为用户提供所见即所得的 Markdown 编辑体验，支持工具栏快捷操作和实时预览。

**(2) 难点解决**
**图片粘贴问题**：EasyMDE 默认不处理剪贴板图片。我通过监听 `paste` 事件，读取 `clipboardData`，利用 `FileReader` 将图片转换为 Base64 编码，并生成 Markdown 图片语法插入编辑器。

```javascript
// Editor.js: 拦截粘贴事件
easyMDE.codemirror.on("paste", function (editor, e) {
  let item = e.clipboardData.items[0];
  if (item.type.indexOf("image") !== -1) {
    let blob = item.getAsFile();
    let reader = new FileReader();
    reader.onload = function (event) {
      // 插入 Base64 图片
      editor.replaceSelection(`![粘贴的图片](${event.target.result})`);
    };
    reader.readAsDataURL(blob);
  }
});
```

### 3.3 拖拽排序与归档

**(1) 功能描述**
实现了类似于操作系统的文件管理体验。用户可以把笔记拖进文件夹，也可以拖动文件夹调整顺序。

**(2) 实现方法**
利用 HTML5 `dragstart`, `dragover`, `drop` API。

- **拖拽**：在 `dataTransfer` 中携带数据（笔记 ID 或文件夹索引）。
- **放置**：读取数据类型。如果是笔记，则修改其 `categoryId`；如果是文件夹，则使用 `splice` 调整数组顺序。

```javascript
// UI.js: Drop 事件处理
li.addEventListener("drop", (e) => {
  const noteId = e.dataTransfer.getData("text/plain");
  // 如果是移动笔记
  if (noteId) {
    handleMoveNoteToCategory(noteId, category.id);
  }
});
```

### 3.4 夜间模式 (Dark Mode)

**(1) 功能描述**
支持一键切换深色主题，保护视力。

**(2) 实现方法**
使用 CSS 变量 (`var(--bg-primary)`) 定义颜色系统。切换时，只需在 `<html>` 标签上添加/移除 `data-theme="dark"` 属性，所有颜色自动根据 CSS 选择器变化。

```css
/* styles.css */
:root {
  --bg-primary: #fff;
}

[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  /* 重新定义所有颜色变量 */
}
```

### 3.5 数据备份与恢复 (Import/Export)

**(1) 功能描述**
允许用户将所有笔记导出为 JSON 文件，或从 JSON 文件恢复数据，防止数据丢失。

**(2) 实现方法**

- **导出**：优先使用现代浏览器 API (`showSaveFilePicker`) 保存文件，让用户自主选择保存位置；若不支持则降级使用 `Blob` 和 `URL.createObjectURL` 触发下载。
- **导入**：使用 `<input type="file">` 读取文件，`JSON.parse` 解析后覆盖当前全局变量，并刷新页面。

```javascript
// Advanced.js: 智能导出逻辑
try {
  if (window.showSaveFilePicker) {
    // 方案A: 现代文件流写入
    const handle = await window.showSaveFilePicker({ suggestedName: fileName });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data));
    await writable.close();
  } else {
    throw new Error("UseFallback");
  }
} catch (err) {
  // 方案B: 传统 Blob 下载
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
}
```

### 3.6 私密空间 (Private Space)

**(1) 功能描述**
为了保护用户隐私，实现了“私密笔记”功能。用户可以将重要笔记移入私密空间，首次使用需设置密码，后续访问或移入时需要验证密码。

**(2) 实现方法**
利用 `localStorage` 存储访问密码。在点击“私密笔记”分类或点击“加锁”按钮时，触发拦截逻辑。

```javascript
// Advanced.js: 私密访问拦截
function handlePrivateAccess(targetId, targetName) {
  const savedPassword = localStorage.getItem("private_password");
  if (!savedPassword) {
    // 首次设置密码
    showModal("设置私密密码", "请设置4-10位访问密码", (inputVal) => {
      if (!inputVal) return;
      localStorage.setItem("private_password", inputVal);
      switchCategory(targetId, targetName);
    });
  } else {
    // 验证密码
    showModal("私密笔记已锁定", "请输入密码解锁", (inputVal) => {
      if (inputVal === savedPassword) switchCategory(targetId, targetName);
      else alert("密码错误");
    });
  }
}
```

### 3.7 待办事项管理 (Todo List)

**(1) 功能描述**
将笔记扩展为待办事项。在“未完成”和“已完成”分类下，笔记列表左侧显示复选框。用户点击复选框可快速切换完成状态。

**(2) 实现方法**
通过 `categories` 的特殊 ID (`todo-unfinished`, `todo-finished`) 区分。在渲染列表时 (`UI.js`) 动态插入 checkbox，并绑定点击事件。

```javascript
// UI.js: 动态渲染 Checkbox
const isTodo = currentCategoryId.startsWith("todo");
// 只有在待办分类下才显示复选框
const checkboxHtml = isTodo
  ? `<div class="todo-check-wrapper"><input type="checkbox" class="todo-checkbox" ...></div>`
  : "";

// Main.js: 监听勾选状态
noteListEl.addEventListener("change", (e) => {
  if (e.target.classList.contains("todo-checkbox")) {
    const note = notes.find((n) => n.id == e.target.dataset.id);
    // 切换分类 ID (未完成 <-> 已完成)
    note.categoryId = e.target.checked ? "todo-finished" : "todo-unfinished";
    note.updateTime = Date.now();
    saveAllToLocalStorage();
    // 延迟刷新列表以展示动画效果
    setTimeout(renderNoteList, 200);
  }
});
```

### 3.8 自定义右键菜单

**(1) 功能描述**
为了替代浏览器默认的右键菜单，实现了自定义上下文菜单，提供“重命名”和“删除”文件夹的快捷入口。

**(2) 实现方法**
监听 `contextmenu` 事件，通过 `e.preventDefault()` 阻止默认菜单，并计算鼠标坐标 (`e.pageX`, `e.pageY`) 来定位自定义菜单 DOM。

```javascript
// UI.js: 绑定右键事件
li.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  // 显示自定义菜单
  ctxMenu.style.left = `${e.pageX}px`;
  ctxMenu.style.top = `${e.pageY}px`;
  ctxMenu.style.display = "block";
  // 记录当前操作的目标ID
  ctxTargetId = category.id;
});
```

### 3.9 PWA 渐进式 Web 应用 (离线支持)

**(1) 功能描述**
将简单的网页升级为 Progressive Web App。

1.  **可安装**：在浏览器地址栏显示安装图标，允许用户将其作为独立应用安装到桌面。
2.  **离线访问**：通过 Service Worker 缓存关键资源，即使断网也能打开应用查看笔记。

**(2) 实现方法**

- **Manifest**：配置 `manifest.json` 定义应用名称、图标、启动方式 (`standalone`)。
- **Service Worker**：编写 `scripts/ServiceWorker.js` 拦截 `fetch` 请求，采用“缓存优先”策略。

```javascript
// scripts/ServiceWorker.js: 缓存优先策略
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // 有缓存直接用，没缓存请求网络
      return response || fetch(e.request);
    })
  );
});
```

```html
<!-- index.html: 注册 SW -->
<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./scripts/ServiceWorker.js");
  }
</script>
```

---

## 四、 实践心得体会

> **提示：**（谈谈通过本次实践所得到的收获和心得体会）

通过本次《Web 程序设计实践》课程的大作业开发，我从零开始构建了一个类似于“小米笔记”的现代化 Web 应用，不仅巩固了基础知识，更在工程实践中获得了宝贵的经验：

1.  **原生开发的魅力与挑战**：
    为了追求极致的性能和零依赖，我坚持不使用 Vue/React 等框架，而是完全使用原生 JavaScript。这让极其深刻地理解了 DOM 操作的底层逻辑（如 `createElement`, `appendChild`, `dataset` 传参）。虽然代码量比使用框架要大，但对各类 API 的掌握程度有了质的飞跃。

2.  **模块化思维的觉醒**：
    项目初期我将所有代码写在一个 `script.js` 中，随着功能增加（超过 500 行），维护变得极其困难。痛定思痛后，我查阅资料，参照 MVC 模式将代码按照功能拆解为 **Data 层（数据）、UI 层（渲染）、Event 层（交互）、Editor 层（编辑器）**。这次重构虽然耗时半天，但之后的开发效率提升了数倍，让我深刻体会到“高内聚、低耦合”不仅仅是一句口号。

3.  **用户体验的细节打磨**：
    很多功能不仅仅是“能用”就行。例如**拖拽归档**，一开始做出来判定很生硬；后来我花了大量精力调整 `dragenter` 和 `dragleave` 的样式反馈，以及拖拽时的半透明效果，才让它变得顺手。还有**防抖保存**，为了防止高频写入 LocalStorage 导致卡顿，我学习并应用了防抖算法。这些细节的打磨是区别“作业”与“产品”的关键。

4.  **解决问题的能力**：
    开发过程中遇到了不少难题，比如 **Markdown 图片粘贴**，EasyMDE 默认不支持，我通过查阅 MDN 的 Clipboard API 文档，结合 FileReader 实现了 Base64 转换插入。这个过程极大锻炼了我查阅文档和独立解决问题的能力。

5.  **版本迭代与重构体会**：
    回顾整个项目的开发历程，我经历了从“简单堆砌”到“系统构建”的完整过程。项目初期（1 月初），我仅完成了静态页面的搭建和基础的增删改查，当时代码都堆在一个文件中。随着功能增加，我发现代码难以维护，于是在中期（1 月 7 日左右）痛下决心进行了**模块化重构**，将代码拆分为 Data、UI、Event 等多个模块。这一过程虽然痛苦，但为后期顺利实现“数据备份”、“夜间模式”等复杂功能打下了坚实基础。这让我深刻理解了软件工程中“磨刀不误砍柴工”的道理。

总的来说，这次实践让我从一个单纯的代码编写者（Coder）向软件构建者（Builder）迈进了一大步。
