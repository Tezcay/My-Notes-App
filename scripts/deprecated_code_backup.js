// ============================================
// 📦 废弃代码备份文件
// ============================================
// 此文件保存了从 script.js 中删除的旧代码片段
// 仅用于历史参考，不会被实际使用
// 创建时间：2026年1月6日
// ============================================

// ============================================
// 备份：旧的index.html工具栏按钮->改为使用外部MDE
// ============================================

/*
<!-- <div class="tool-left">
          <button class="tool-btn mobile-only" id="mobile-back-btn" style="margin-right: 10px;"><i
              class="fa-solid fa-arrow-left"></i></button>

          <button class="tool-btn"><i class="fa-regular fa-image"></i></button>
          <button class="tool-btn"><i class="fa-regular fa-square-check"></i></button>

          <span class="divider">|</span>

          <button class="tool-btn text-icon">H<sub>1</sub></button>
          <button class="tool-btn text-icon">H<sub>2</sub></button>
          <button class="tool-btn text-icon">H<sub>3</sub></button>

          <button class="tool-btn"><i class="fa-solid fa-bold"></i></button>
          <button class="tool-btn"><i class="fa-solid fa-italic"></i></button>
          <button class="tool-btn"><i class="fa-solid fa-underline"></i></button>
          <button class="tool-btn"><i class="fa-solid fa-strikethrough"></i></button>

          <span class="divider">|</span>

          <button class="tool-btn"><i class="fa-solid fa-list-ul"></i></button>
          <button class="tool-btn"><i class="fa-solid fa-list-ol"></i></button>
          <button class="tool-btn"><i class="fa-solid fa-quote-right"></i></button>

          <span class="divider">|</span>

          <button class="tool-btn"><i class="fa-solid fa-align-left"></i></button>
          <button class="tool-btn" style="color: #f5a623;"><i class="fa-solid fa-font"></i></button>
        </div> -->
*/

// ============================================
// 备份1：旧的模拟数据（第1-29行）
// ============================================
/*
// 用 let 定义数据，方便后续修改(删除/添加)
let notes = [
  {
    id: 1,
    title: "First Note",
    content: "This is the content of the first note.",
    updateTime: "just now",
    categoryId: "uncategorized"
  },
  {
    id: 2,
    title: "Shopping List",
    content: "Milk, Bread, Eggs, Butter",
    updateTime: "10 minutes ago",
    categoryId: "all"
  },
  {
    id: 3,
    title: "Work Meeting",
    content: "Discuss project milestones and deadlines.",
    updateTime: "1 hour ago",
    categoryId: "folder-call"
  },
  {
    id: 4,
    title: "To-Do: Gym",
    content: "Leg day workout routine.",
    updateTime: "3 days ago",
    categoryId: "todo-unfinished"
  }
];
*/

// ============================================
// 备份2：旧的导航点击事件（第347-395行）
// ============================================
/*
// 左侧导航点击事件
navItems.forEach(item => {
  item.addEventListener('click', () => {
    // 1. 样式切换
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    // 2. 逻辑切换
    const categoryId = item.getAttribute('data-id');
    const categoryName = item.querySelector('.text').textContent;

    //更新状态
    currentCategoryId = categoryId;
    currentNoteId = null; // 切换分类时，清除当前选中笔记

    // 更新UI
    listTitleEl.textContent = categoryName; // 更新中间的大标题

    // 重新渲染笔记列表
    renderNoteList();

    // 清空右侧编辑器
    editorTitle.value = '';
    editorContent.value = '';
  });
});
*/

// ============================================
// 备份3：旧的prompt新建文件夹（第555-570行）
// ============================================
/* // B1. 新增文件夹按钮点击事件
if (addFolderBtn) {
  addFolderBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发侧边栏点击事件
    const folderName = prompt('请输入新文件夹名称：');
    if (folderName) {
      const newCategory = {
        id: 'folder-' + Date.now(), // 使用时间戳生成唯一ID
        name: folderName
      };
      categories.push(newCategory);
      // 保存数据到 LocalStorage
      saveAllToLocalStorage();
      renderFolderList();
    }
  });
} */

// ============================================
// 备份4：旧的预览按钮逻辑（第916-943行）
// ============================================
/* // 预览功能
const previewBtn = document.getElementById('preview-btn');
const editorContainer = document.querySelector('.editor-container');
const previewArea = document.getElementById('note-preview-area');

if (previewBtn) {
  previewBtn.addEventListener('click', () => {
    editorContainer.classList.toggle('previewing-mode');
    const isPreview = editorContainer.classList.contains('previewing-mode');

    if (isPreview) {
      // marked.parse() 将 Markdown 转换为 HTML
      previewArea.innerHTML = marked.parse(editorContent.value || '无内容');
      previewBtn.innerHTML = '<i class="fa-solid fa-pen"></i>'; // 换图标

      // 修改悬浮提示
      previewBtn.title = "编辑模式";

      editorTitle.disabled = true; // 预览时禁用标题
      editorContent.disabled = true; // 预览时禁用内容
    } else {
      previewBtn.innerHTML = '<i class="fa-solid fa-eye"></i>'; // 换图标

      // 修改悬浮提示
      previewBtn.title = "预览模式";

      editorTitle.disabled = false;
      editorContent.disabled = false;
    }
  });
} */

// ============================================
// 备份5：旧的更新静态导航项的选中状态（第134-140行）
// ============================================
/*
// 因为动态渲染会重绘文件夹，静态项需要手动维护 class
function updateStaticNavHighlight() {
  const allNavItems = document.querySelectorAll('.nav-item');
  allNavItems.forEach(item => {
    if (currentCategoryId === item.dataset.id) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}
*/

// ============================================
// 备份6：旧的编辑器加载逻辑（第142-148行）
// ============================================
/*
// ----------------------------------------------------------------------------
// C3. 编辑器加载
// ----------------------------------------------------------------------------

/
 * 加载笔记到右侧编辑器（简化版）
 * 注意：完整的加载函数在模块B3有完整版本（带锁机制）
 * @param {Object} note - 笔记对象
/
function loadNoteToEditor(note) {
  editorTitle.value = note.title;
  editorContent.value = note.content;
}

// 注意：此部分已被EasyMDE编辑器替代，保留用于兼容
[editorTitle, editorContent].forEach(input => {
  input.addEventListener('input', () => {
    // 如果没有选中笔记，不允许编辑
    if (!currentNoteId) return;

    // 获取当前编辑的笔记对象
    const currentNote = notes.find(n => n.id === currentNoteId);

    if (currentNote) {
      // 更新数据
      currentNote.title = editorTitle.value;
      currentNote.content = editorContent.value;
      currentNote.updateTime = Date.now(); // 存时间戳

      // 保存数据到 LocalStorage
      saveAllToLocalStorage();
      // 重新渲染笔记列表，更新预览和时间
      renderNoteList();

      // 重绘后焦点可能会丢失，简单处理：保持 focus 状态 (浏览器默认行为通常能保持)
      // 如果发现输入卡顿或焦点丢失，可以优化这里的逻辑
    }
  });
});
*/

