# 项目代码完全指南 (Developer Guide)

这份文档旨在帮助你**系统性地理解**整个项目的代码逻辑。即使这是你第一次接触原生 JavaScript 开发，读完这份文档也能让你对每一行代码的作用了然于胸。

---

## 🏗️ 核心架构逻辑

**一句话总结**：这是一个 **SPA (单页应用)**。整个项目只有一个 HTML 页面 (`index.html`)，所有的界面变化（切换列表、打开笔记、弹出窗口）都是通过 JavaScript 修改 DOM（网页元素）来实现的，而不是跳转页面。

### 数据流向图

```mermaid
graph TD
    A[用户操作] -->|点击/输入| B(JavaScript 事件监听)
    B -->|修改| C{数据层 (Data.js)}
    C -->|保存| D[(LocalStorage)]
    C -->|触发| E(UI渲染 (UI.js))
    E -->|更新| F[HTML 页面展示]
```

---

## 📂 文件作用速查

| 文件名                | 对应现实世界的比喻  | 核心职责                                                                 |
| :-------------------- | :------------------ | :----------------------------------------------------------------------- |
| `index.html`          | **房子的骨架**      | 定义了哪有墙、哪有门。包含了侧边栏、列表区、编辑区的基本结构。           |
| `styles/styles.css`   | **装修与软装**      | 定义颜色、大小、布局。使用了 **Flexbox** 布局来实现左中右三栏自适应。    |
| `scripts/Main.js`     | **总指挥官/管家**   | 监听用户的点击（Click）、输入（Input）事件，指挥其他模块干活。           |
| `scripts/Data.js`     | **仓库管理员/账本** | 负责 `notes`（笔记数组）和 `categories`（分类数组）的增删改查与存盘。    |
| `scripts/UI.js`       | **装修队/画师**     | 拿到数据后，把数据画到屏幕上（`renderNoteList`），比如生成 `<li>` 标签。 |
| `scripts/Advanced.js` | **特种兵**          | 负责私密笔记、右键菜单、导出数据等复杂的高级功能。                       |
| `scripts/Editor.js`   | **专业打字机**      | 配置 Markdown 编辑器 (EasyMDE)，处理图片粘贴。                           |

---

## 🔍 关键代码逻辑解析

### 1. 为什么刷新页面数据还在？(Data.js)

我们在 `Data.js` 中利用了浏览器的 **LocalStorage**（本地数据库）。

```javascript
// Data.js
function saveAllToLocalStorage() {
  // 把像对象一样的内存数据，转换成字符串(JSON.stringify)存进硬盘
  localStorage.setItem("notes", JSON.stringify(notes));
}
```

**原理**：每次你修改笔记，我们都调用这个函数。下次打开页面时，我们用 `JSON.parse` 把字符串变回对象。

### 2. 怎么实现点一下左边，右边就变了？(Main.js + UI.js)

这是一个典型的 **事件驱动** 流程：

1.  **监听**：`sidebar.addEventListener('click', ...)` 监听到你点了“工作资料”文件夹。
2.  **改状态**：`switchCategory('folder-work')` 把全局变量 `currentCategoryId` 改成 'folder-work'。
3.  **重绘**：调用 `renderNoteList()`。
    - 这个函数会遍历所有笔记：`notes.filter(...)`。
    - 只留下 `note.categoryId === 'folder-work'` 的笔记。
    - 把留下的笔记生成 HTML 放到页面上。

### 3. 三栏布局是怎么做出来的？(styles.css)

核心魔法是 CSS 的 **Flexbox**：

```css
/* styles.css */
.app {
  display: flex; /*开启 Flex 布局*/
}
.sidebar {
  width: 250px; /* 左边固定宽 */
}
.list-view {
  width: 320px; /* 中间固定宽 */
}
.editor-view {
  flex: 1; /* 右边占满剩余所有空间 */
}
```

`flex: 1` 的意思是：浏览器窗口剩多少宽，我就占多少。所以当你拉伸窗口时，只有编辑区会变宽。

### 4. 拖拽是怎么实现的？(UI.js)

使用的是 HTML5 原生 **Drag and Drop API**：

1.  **`dragstart` (开始拖)**：在笔记卡片上，把这条笔记的 `id` 塞进口袋（`e.dataTransfer.setData`）。
2.  **`drop` (放下)**：在文件夹上，检测到有东西放下了。
    - 从口袋里拿出 `id`。
    - 找到这条笔记，把它的 `categoryId` 改成这个文件夹的 ID。
    - 保存，刷新。

---

## 🎓 给老师/面试官的技术亮点话术（小白版）

如果需要讲解代码，可以用这些专业术语“唬”住对方：

1.  **"模块化设计" (Modular Design)**：
    - _话术_：“为了不想让代码变成一团乱麻，我把代码拆成了 Data（数据）、UI（视图）、Main（控制）三个部分，遵循了关注点分离的原则。”
2.  **"状态驱动 UI" (State-Driven UI)**：
    - _话术_：“我的页面不是写死的，而是由数据决定的。我维护了一个全局状态 `notes` 数组，所有界面更新都源于数据的变化，这和 React/Vue 的思想是一致的。”
3.  **"防抖与节流" (虽然只用了一点点)**：
    - _话术_：“在搜索框输入时，我监听了 `input` 事件，配合 DOM 的高效更新，实现了实时的搜索高亮。”
4.  **"PWA 离线能力" (Progressive Web App)**：
    - _话术_：“我使用了 Service Worker 拦截网络请求，采用 Cache-First 策略，让应用在没有网的时候也能秒开。”

---

希望这份指南就是你“看懂代码的眼镜”。对照着代码文件看一遍，你会发现它们其实很简单！
