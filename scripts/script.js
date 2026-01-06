// ============================================================================
// MyNotesApp - 主脚本文件
// ============================================================================
// 
// 📋 模块结构概览：
// 
// 【模块A】数据层 (Data Layer) 📦
//    ├─ A1. 数据结构定义 - 默认数据、笔记数组、分类数组
//    ├─ A2. LocalStorage操作 - 数据持久化函数
//    ├─ A3. 数据初始化 - 从存储读取或使用默认数据
//    └─ A4. 数据迁移与兼容 - 旧数据格式转换
//
// 【模块B】工具函数 (Utilities) 🔧
//    ├─ B1. DOM操作辅助 - 元素获取与引用
//    ├─ B2. 时间格式化 - 相对时间显示
//    ├─ B3. 文本处理 - (预留)
//    └─ B4. 搜索与高亮 - 关键词匹配与高亮渲染
//
// 【模块C】UI渲染 (Rendering) 🎨
//    ├─ C1. 侧边栏渲染 - 文件夹列表生成
//    ├─ C2. 笔记列表渲染 - 中间区域笔记列表
//    ├─ C3. 编辑器加载 - 笔记内容加载到编辑器
//    └─ C4. 弹窗渲染 - 自定义模态框显示
//
// 【模块D】事件处理 (Event Handlers) ⚡
//    ├─ D1. 分类切换 - 侧边栏导航点击
//    ├─ D2. 笔记CRUD - 新建、编辑、删除笔记
//    ├─ D3. 拖拽功能 - 笔记拖动到文件夹
//    └─ D4. 搜索与排序 - 搜索输入、排序切换
//
// 【模块E】编辑器集成 (Editor) ✏️
//    ├─ E1. EasyMDE初始化 - Markdown编辑器配置
//    ├─ E2. 自定义工具栏 - 工具按钮与布局
//    ├─ E3. 图片上传 - 本地图片转Base64
//    └─ E4. 预览模式 - Markdown渲染与切换
//
// 【模块F】高级功能 (Advanced) 🚀
//    ├─ F1. 私密笔记 - 密码保护访问
//    ├─ F2. 右键菜单 - 文件夹重命名与删除
//    ├─ F3. 自定义弹窗 - 输入与确认弹窗
//    ├─ F4. 撤销功能 - 编辑器历史回退
//    ├─ F5. 主题切换 - 深色/浅色模式
//    └─ F6. 移动端适配 - 响应式交互逻辑
//
// ============================================================================

// ============================================================================
// 【模块A】数据层 📦 (Data Layer)
// ============================================================================

// ----------------------------------------------------------------------------
// A1. 数据结构定义
// ----------------------------------------------------------------------------
// 定义笔记和分类的默认初始数据，用于首次加载或数据为空时使用
const defaultNotes = [
  {
    id: 1,
    title: "欢迎使用",
    content: "试着新建一个文件夹，把这条笔记拖进去（假装拖拽，其实是移动）...",
    updateTime: Date.now(),
    categoryId: "uncategorized"
  }
];

const defaultCategories = [
  {
    id: "folder-work",
    name: "工作资料"
  },
  {
    id: "folder-study",
    name: "学习笔记"
  }
];

// ----------------------------------------------------------------------------
// A2. LocalStorage操作
// ----------------------------------------------------------------------------

/**
 * 保存所有数据到LocalStorage
 * 在任何数据变更后调用此函数以持久化数据
 */
function saveAllToLocalStorage() {
  localStorage.setItem('notes', JSON.stringify(notes));
  localStorage.setItem('categories', JSON.stringify(categories));
}

// ----------------------------------------------------------------------------
// A3. 数据初始化
// ----------------------------------------------------------------------------
// 优先从 LocalStorage 读取已保存的数据；如果不存在，则使用默认初始数据
let notes = JSON.parse(localStorage.getItem('notes')) || defaultNotes;
let categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;

// ----------------------------------------------------------------------------
// A4. 数据迁移与兼容
// ----------------------------------------------------------------------------
// 将旧版本数据格式迁移到新格式，确保向后兼容
// 例如：将旧的 "刚刚" 字符串转换为时间戳
notes.forEach(note => {
  if (note.updateTime === '刚刚') {
    note.updateTime = Date.now();
  }
});
saveAllToLocalStorage(); // 保存修正后的数据

// 应用状态管理
// 记录当前的UI状态和用户交互状态
let currentCategoryId = "all"; // 当前选中的分类ID，默认'all'
let currentNoteId = null; // 当前选中的笔记ID
let currentSearchKeyword = ''; // 当前搜索关键词
let currentSortMode = 'timeDesc'; // 当前排序模式: timeDesc, timeAsc, titleAsc
let isLoadingNote = false; // 加载锁：防止加载笔记时触发编辑事件

// ============================================================================
// 【模块B】工具函数 🔧 (Utilities)
// ============================================================================

// ----------------------------------------------------------------------------
// B1. DOM操作辅助
// ----------------------------------------------------------------------------
// 获取并缓存常用的DOM元素引用，提升性能

// 侧边栏相关
const sidebar = document.querySelector('.sidebar'); // 左侧整个侧边栏(用于事件委托)
const folderListEl = document.getElementById('folder-list'); // 自定义文件夹列表容器
const addFolderBtn = document.getElementById('add-folder-btn'); // 左侧新增文件夹按钮
const listTitleEl = document.querySelector('.list-header-top h2'); // 中间顶部标题
const folderToggleBtn = document.getElementById('folder-toggle-btn'); // 文件夹折叠按钮
const folderHeader = document.querySelector('.folder-header'); // 文件夹头部

// 中间笔记列表相关
const noteListEl = document.querySelector('.note-list'); // 中间笔记列表容器
const noteCountEl = document.querySelector(".count-text"); // 中间共xx条笔记
const sortActionBtn = document.querySelector('.sort-action'); // 排序按钮
const searchInput = document.querySelector('.search-box input'); // 搜索输入框
const addNoteBtn = document.querySelector('.add-circle-btn'); // 中间黄色的新增按钮

// 右侧编辑器相关
const deleteBtn = document.querySelector('.delete-btn'); // 右上角的删除按钮
const editorTitle = document.getElementById('note-title');
const editorContent = document.getElementById('note-content');
const undoBtn = document.getElementById('undo-btn'); // 撤销按钮

// 高级功能相关
const themeToggleBtn = document.getElementById('theme-toggle-btn'); // 主题切换按钮
const mobileMenuBtn = document.getElementById('mobile-menu-btn'); // 移动端菜单按钮
const mobileBackBtn = document.getElementById('mobile-back-btn'); // 移动端返回按钮
const appContainer = document.querySelector('.app'); // 应用主容器

// ----------------------------------------------------------------------------
// B2. 时间格式化
// ----------------------------------------------------------------------------

/**
 * 时间格式化函数
 * 将时间戳转换为人性化的相对时间显示
 * @param {number} timestamp - 毫秒时间戳
 * @return {string} 格式化后的时间字符串（刚刚、X分钟前、HH:MM、MM/DD、YYYY/MM/DD）
 */
function formatTime(timestamp) {
  // 兼容旧数据：如果是字符串且无法转为有效日期（例如 "刚刚"），直接返回
  if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    if (isNaN(parsed)) {
      return timestamp;
    }
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp; // 双重保险

  const now = new Date();
  const diff = now - date; // Time difference in milliseconds

  // Less than 1 minute: Just now
  if (diff < 60 * 1000) {
    return '刚刚';
  }

  // Less than 1 hour: xx minutes ago
  if (diff < 60 * 60 * 1000) {
    return Math.floor(diff / (60 * 1000)) + '分钟前';
  }

  const isToday = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const isThisYear = date.getFullYear() === now.getFullYear();

  // Helper: pad with zero
  const pad = (n) => n < 10 ? '0' + n : n;

  if (isToday) {
    // Today: HH:MM
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } else if (isThisYear) {
    // This Year: MM/DD
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
  } else {
    // Other: YYYY/MM/DD
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
  }
}

// ----------------------------------------------------------------------------
// B3. 文本处理 (预留)
// ----------------------------------------------------------------------------
// 目前没有专门的文本处理函数，留作扩展

// ----------------------------------------------------------------------------
// B4. 搜索与高亮
// ----------------------------------------------------------------------------

/**
 * 关键词高亮工具函数
 * 在文本中搜索关键词并用HTML标签高亮显示
 * @param {string} text - 原始文本
 * @param {string} keyword - 要高亮的搜索关键词
 * @return {string} 包含高亮标签的HTML字符串
 */
function highlightText(text, keyword) {
  // 如果没搜词，直接返回原文本
  if (!keyword) return text;

  // 使用正则进行替换 (gi 表示全局 + 忽略大小写)
  const regex = new RegExp(`(${keyword})`, 'gi');

  // 把匹配到的部分变成 绿色+加粗
  return text.replace(regex, '<span style="color: #10B981; font-weight: bold;">$1</span>');
}

// ============================================================================
// 【模块C】UI渲染 🎨 (Rendering)
// ============================================================================

// ----------------------------------------------------------------------------
// C1. 侧边栏渲染
// ----------------------------------------------------------------------------

/**
 * 渲染左侧"我的文件夹"列表
 * 支持拖拽功能和右键菜单（重命名、删除）
 */
function renderFolderList() {
  // 清空现有列表
  folderListEl.innerHTML = '';

  // 生成 HTML
  categories.forEach(category => {
    const li = document.createElement('li');
    li.className = 'nav-item sub-item';
    li.dataset.id = category.id; // 存储 ID 到 data 属性

    // 检查是否被选中
    if (currentCategoryId === category.id) {
      li.classList.add('active');
    }

    li.innerHTML = `
      <span class="icon"><i class="fa-regular fa-folder"></i></span>
      <span class="text">${category.name}</span>
    `;

    // 右键点击事件：呼出菜单
    li.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // 阻止默认浏览器菜单
      showContextMenu(e, category.id); // 呼出我们的菜单
    });

    // 拖放目标事件
    li.addEventListener('dragover', (e) => {
      e.preventDefault(); // 允许放置
      li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      // ID可能是数字也可能是字符串，统一处理
      const rawId = e.dataTransfer.getData('text/plain');
      const noteId = isNaN(rawId) ? rawId : parseInt(rawId);
      handleMoveNoteToCategory(noteId, category.id);
    });

    folderListEl.appendChild(li);
  });

  // 同时更新静态导航项的选中状态（全部、未分类等）
  updateStaticNavHighlight();
}

/**
 * 更新静态导航项的选中状态（全部、未分类等）
 * 因为动态渲染会重绘文件夹，静态项需要手动维护 class
 */
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

// ----------------------------------------------------------------------------
// C2. 笔记列表渲染
// ----------------------------------------------------------------------------

/**
 * 渲染中间区域的笔记列表
 * 功能：筛选、排序、搜索高亮、空状态处理、拖拽支持
 */
function renderNoteList() {
  // 1. 联合筛选：既要符合“分类”，又要符合“搜索词”
  const filteredNotes = notes.filter(note => {
    // a. 搜索词筛选
    // 把标题和内容拼在一起搜，只要有一个包含关键词就算匹配
    const contentToSearch = (note.title + note.content).toLowerCase();
    const keyword = currentSearchKeyword.toLowerCase();

    // 如果搜不到，直接淘汰
    if (!contentToSearch.includes(keyword)) return false;

    // b. 分类筛选 
    // 回收站
    if (currentCategoryId === "trash") return note.categoryId === "trash";
    // 不在回收站时，绝对不能显示回收站的内容
    if (note.categoryId === "trash") return false;
    // 在全部笔记里隐藏私密笔记
    if (currentCategoryId === "all") {
      return note.categoryId !== 'private';
    }
    // 其他普通情况
    return note.categoryId === currentCategoryId;
  });

  // 2. 排序逻辑
  filteredNotes.sort((a, b) => {
    switch (currentSortMode) {
      case 'timeDesc': // 时间倒序（最新在前）
        return new Date(b.updateTime) - new Date(a.updateTime);
      case 'timeAsc': // 时间正序（旧的在前）
        return new Date(a.updateTime) - new Date(b.updateTime);
      case 'titleAsc': // 标题 A-Z
        return (a.title || '').localeCompare(b.title || '', 'zh-CN');
      default:
        return 0;
    }
  });

  // 3. 更新顶部统计
  if (noteCountEl) {
    noteCountEl.textContent = `共 ${filteredNotes.length} 条笔记`;
  }

  // 4. 清空列表
  noteListEl.innerHTML = '';

  // 5. 空状态处理
  if (filteredNotes.length === 0) {
    // 如果是因为搜索没结果
    if (currentSearchKeyword) {
      noteListEl.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">未搜索到相关笔记</div>';
    } else {
      // 之前的空状态逻辑
      const emptyIcon = currentCategoryId === 'trash' ? 'fa-trash-can' : 'fa-box-open';
      const emptyText = currentCategoryId === 'trash' ? '回收站里没有笔记' : '这里空空如也，快去记点什么吧';
      noteListEl.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ccc; padding-top: 60px;">
            <i class="fa-solid ${emptyIcon}" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
            <div style="font-size: 14px;">${emptyText}</div>
          </div>`;
    }
    return;
  }

  // 6. 生成列表 (带高亮!)
  filteredNotes.forEach(note => {
    const li = document.createElement('li');
    li.dataset.id = note.id; // 方便以后精确找到它
    li.className = 'note-item';
    if (note.id === currentNoteId) li.classList.add('active');

    // 设置可拖动
    li.draggable = true;
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', note.id.toString());
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
    });

    // 关键点：调用 highlightText 处理标题和预览
    const displayTitle = highlightText(note.title || '无标题', currentSearchKeyword);
    // 简单的去除 Markdown 符号逻辑，用于预览
    const plainContent = (note.content || '').replace(/[#*`]/g, '').replace(/\n/g, ' ').substring(0, 50);
    const displayContent = highlightText(plainContent || '无内容', currentSearchKeyword);

    li.innerHTML = `
      <div class="note-title">${displayTitle}</div>
      <div class="note-preview">${displayContent}</div>
      <div class="note-date">${formatTime(note.updateTime)}</div>
    `;

    li.addEventListener('click', () => {
      currentNoteId = note.id;
      renderNoteList();
      loadNoteToEditor(note);

      // 手机端自动进入编辑模式
      const appContainer = document.querySelector('.app');
      if (appContainer) appContainer.classList.add('mobile-editing');
    });

    noteListEl.appendChild(li);
  });
}

// ----------------------------------------------------------------------------
// C3. 编辑器加载
// ----------------------------------------------------------------------------

/**
 * 加载笔记到右侧编辑器 (完整版：带锁机制)
 * @param {Object} note - 笔记对象
 */
function loadNoteToEditor(note) {
  // 1. 上锁：告诉系统“正在加载，不是用户在打字”
  isLoadingNote = true;

  currentNoteId = note.id;

  // 更新标题输入框
  editorTitle.value = note.title;

  // 更新编辑器内容
  if (typeof easyMDE !== 'undefined' && easyMDE) {
    easyMDE.value(note.content || "");

    // ⏳ 延迟解锁：等编辑器渲染完了，再把锁打开
    // (这是为了防止 easyMDE 设置值时瞬间触发 change 事件)
    setTimeout(() => {
      isLoadingNote = false;
    }, 200);
  } else {
    // 兼容没有 EasyMDE 的情况
    editorContent.value = note.content || "";
    isLoadingNote = false;
  }

  // 移动端逻辑
  const container = document.querySelector('.editor-container');
  if (container) container.classList.remove('preview-mode');
  editorTitle.disabled = false;
}

// ----------------------------------------------------------------------------
// C4. 弹窗渲染
// ----------------------------------------------------------------------------

// ===========================================
// 🎨 自定义弹窗逻辑 (增强版：支持输入 & 确认)
// ===========================================
const modalOverlay = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalInput = document.getElementById('modal-input');
const modalConfirmBtn = document.getElementById('modal-confirm');
const modalCancelBtn = document.getElementById('modal-cancel');

let onModalConfirm = null;
let isInputMode = true; // 标记当前是输入模式还是纯确认模式

/**
 * 显示输入框弹窗（用于新建文件夹、设置密码等需要用户输入的场景）
 * @param {string} title - 弹窗标题
 * @param {string} placeholder - 输入框占位符
 * @param {Function} callback - 确认后的回调函数，接收输入值作为参数
 */
function showModal(title, placeholder, callback) {
  isInputMode = true;
  modalTitle.textContent = title;

  // UI 切换：显示输入框，隐藏文本
  modalInput.style.display = 'block';
  modalDesc.style.display = 'none';

  modalInput.placeholder = placeholder;
  modalInput.value = '';

  // 密码框处理
  if (title.includes('密码') || title.includes('锁定')) {
    modalInput.type = 'password';
  } else {
    modalInput.type = 'text';
  }

  modalOverlay.style.display = 'flex';
  setTimeout(() => modalInput.focus(), 50); // 延迟聚焦防抖
  onModalConfirm = callback;
}

/**
 * 显示确认弹窗（用于删除确认等只需确认/取消的场景）
 * @param {string} title - 弹窗标题
 * @param {string} message - 提示消息
 * @param {Function} callback - 确认后的回调函数
 */
function showConfirm(title, message, callback) {
  isInputMode = false;
  modalTitle.textContent = title;

  // UI 切换：隐藏输入框，显示文本
  modalInput.style.display = 'none';
  modalDesc.style.display = 'block';
  modalDesc.textContent = message;

  modalOverlay.style.display = 'flex';
  onModalConfirm = callback;
}

/**
 * 隐藏弹窗并清理状态
 */
function hideModal() {
  modalOverlay.style.display = 'none';
  onModalConfirm = null;
}

// 绑定按钮事件
if (modalCancelBtn) modalCancelBtn.onclick = hideModal;

if (modalConfirmBtn) {
  modalConfirmBtn.onclick = () => {
    if (isInputMode) {
      // A. 输入模式：必须有值
      const value = modalInput.value.trim();
      if (value) {
        if (onModalConfirm) onModalConfirm(value);
        hideModal();
      } else {
        alert("内容不能为空");
      }
    } else {
      // B. 确认模式：直接执行
      if (onModalConfirm) onModalConfirm();
      hideModal();
    }
  };
}

// 回车键支持 (只在输入模式下生效)
if (modalInput) {
  modalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') modalConfirmBtn.click();
  });
}

// ============================================================================
// 【模块D】事件处理 ⚡ (Event Handlers)
// ============================================================================

// ----------------------------------------------------------------------------
// D1. 分类切换
// ----------------------------------------------------------------------------

/**
 * 切换分类的通用函数
 * 更新当前分类ID、刷新UI、清空编辑器，处理移动端自动收起侧边栏
 * @param {string} id - 分类ID
 * @param {string} name - 分类名称
 */
function switchCategory(id, name) {
  // 1. 更新状态
  currentCategoryId = id;
  currentNoteId = null; // 清除选中笔记

  // 2. 更新UI
  listTitleEl.textContent = name;
  renderFolderList(); // 更新高亮
  renderNoteList();   // 刷新列表

  // 3. 清空编辑器
  editorTitle.value = '';
  // 如果EasyMDE已加载，清空它
  if (typeof easyMDE !== 'undefined' && easyMDE) {
    easyMDE.value("");
  }

  // 4. 手机端自动收起侧边栏
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('open');
  }
}

// 侧边栏点击事件监听（使用事件委托处理动态元素）
sidebar.addEventListener('click', (e) => {
  // 找到被点击的.nav-item元素
  const navItem = e.target.closest('.nav-item');

  if (navItem) {
    const targetId = navItem.dataset.id;
    const targetName = navItem.querySelector('.text').textContent;

    // 🔒 拦截私密笔记（逻辑在模块F1，JS会自动提升函数声明，此处调用没问题）
    if (targetId === 'private') {
      if (typeof handlePrivateAccess === 'function') {
        handlePrivateAccess(targetId, targetName);
      } else {
        // 防止 F模块还没粘贴时报错
        console.warn('私密笔记模块尚未加载');
      }
      return;
    }

    // 普通分类直接切换
    switchCategory(targetId, targetName);
  }
});


// ----------------------------------------------------------------------------
// D2. 笔记CRUD (创建、读取、更新、删除)
// ----------------------------------------------------------------------------

// ===========================================
// D2-1. 新增文件夹（使用自定义弹窗）
// ===========================================
if (addFolderBtn) {
  addFolderBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // 调用模块C4定义的弹窗
    showModal('新建文件夹', '请输入文件夹名称', (folderName) => {
      const newCategory = {
        id: 'folder-' + Date.now(),
        name: folderName
      };
      categories.push(newCategory);
      saveAllToLocalStorage();
      renderFolderList();
    });
  });
}

// ===========================================
// D2-2. 新增笔记（实时保存）
// ===========================================
if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    // 1. 创建新笔记对象
    const newId = String(Date.now()); // 使用时间戳作为唯一ID

    // 确定新笔记的分类：如果是全部/未分类/待办，默认归入未分类；否则归入当前文件夹
    let targetCategoryId = currentCategoryId;
    if (currentCategoryId === "all" || currentCategoryId.startsWith('todo')) {
      targetCategoryId = "uncategorized";
    }

    const newNote = {
      id: newId,
      title: '新建笔记',
      content: '',
      updateTime: Date.now(),
      categoryId: targetCategoryId
    };

    // 2. 添加到数据数组最前面
    notes.unshift(newNote);
    saveAllToLocalStorage();

    // 3. 选中这个新笔记
    currentNoteId = newId;

    // 4. 重新渲染笔记列表
    renderNoteList();

    // 5. 加载新笔记到编辑器 (调用模块C3)
    loadNoteToEditor(newNote);

    // 6. 自动聚焦标题输入框
    editorTitle.focus();
  });
}

// ===========================================
// D2-3. 标题实时编辑与保存
// ===========================================
if (editorTitle) {
  editorTitle.addEventListener('input', (e) => {
    if (currentNoteId) {
      const note = notes.find(n => n.id == currentNoteId); // == 兼容数字和字符串
      if (note) {
        // 1. 更新内存数据
        note.title = e.target.value;
        note.updateTime = Date.now();

        // 2. 存进硬盘
        saveAllToLocalStorage();

        // 3. 性能优化：只更新左侧列表里当前这一项的文字 (不重排整个列表)
        const activeTitle = document.querySelector(`.note-item[data-id="${currentNoteId}"] .note-title`);
        if (activeTitle) {
          activeTitle.textContent = note.title || '无标题';
        }
      }
    }
  });
}

// ===========================================
// D2-4. 删除笔记（移入回收站或永久删除）
// ===========================================
if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    if (!currentNoteId) {
      alert('请先选择一条要删除的笔记');
      return;
    }

    const currentNote = notes.find(n => n.id == currentNoteId);
    if (!currentNote) return;

    // 场景 A：从回收站永久删除
    if (currentCategoryId === "trash") {
      showConfirm('永久删除', '确定要永久销毁这条笔记吗？此操作无法撤销。', () => {
        notes = notes.filter(n => n.id != currentNoteId);
        saveAllToLocalStorage();

        // 调用重置编辑器 (模块F4，暂未加载时需注意)
        if (typeof resetEditor === 'function') resetEditor();
        else {
          // 简单回退策略
          editorTitle.value = '';
          currentNoteId = null;
        }

        renderNoteList();
      });
      return;
    }

    // 场景 B：移入回收站
    showConfirm('移入回收站', '确定要将这条笔记丢进回收站吗？', () => {
      currentNote.categoryId = "trash";
      currentNote.updateTime = Date.now();
      saveAllToLocalStorage();

      if (typeof resetEditor === 'function') resetEditor();
      else {
        editorTitle.value = '';
        currentNoteId = null;
      }

      renderNoteList();
    });
  });
}

// ===========================================
// D2-5. 删除文件夹逻辑
// ===========================================

/**
 * 删除文件夹处理函数
 * 将文件夹内的笔记移动到"未分类"，然后删除文件夹
 * @param {Object} category - 分类对象
 */
function handleDeleteFolder(category) {
  if (confirm(`确定要删除文件夹 "${category.name}" 及其所有笔记吗？`)) {
    // 1. 找到属于该分类的所有笔记，把它们移到 'uncategorized'
    notes.forEach(note => {
      if (note.categoryId === category.id) {
        note.categoryId = 'uncategorized';
      }
    });

    // 2. 从分类数组中删除该分类
    categories = categories.filter(c => c.id !== category.id);

    // 3. 如果当前分类是被删除的分类，切换到'all'
    if (currentCategoryId === category.id) {
      currentCategoryId = 'all';
      listTitleEl.textContent = '全部笔记';
    }

    // 4. 保存数据并刷新
    saveAllToLocalStorage();
    renderFolderList();
    renderNoteList();
  }
}

// ----------------------------------------------------------------------------
// D3. 拖拽功能
// ----------------------------------------------------------------------------

/**
 * 移动笔记到指定分类（拖拽使用）
 * @param {number|string} noteId - 笔记ID
 * @param {string} categoryId - 目标分类ID
 */
function handleMoveNoteToCategory(noteId, categoryId) {
  // == 兼容ID类型差异
  const note = notes.find(n => n.id == noteId);
  if (!note) return;

  // 如果已经在这个分类，不做任何操作
  if (note.categoryId === categoryId) return;

  // 🔥 特殊处理：拖入回收站时需要确认
  if (categoryId === 'trash') {
    if (!confirm(`确定要将笔记 "${note.title}" 移动到回收站吗? `)) {
      return; // 用户取消
    }
  }

  note.categoryId = categoryId;
  note.updateTime = Date.now();
  saveAllToLocalStorage();
  renderNoteList();
}

// 初始化静态导航项的拖拽目标 (全部、未分类等)
const staticNavItemsForDrag = document.querySelectorAll('.nav-item[data-id]');
staticNavItemsForDrag.forEach(navItem => {
  const categoryId = navItem.dataset.id;

  // 跳过不能接收笔记的分类（如全部、待办等逻辑上不适合直接拖入的）
  // 注意：原代码允许拖入 'uncategorized' 或其他自定义ID
  if (['all', 'todo-unfinished', 'todo-finished'].includes(categoryId)) return;

  navItem.addEventListener('dragover', (e) => {
    e.preventDefault();
    navItem.classList.add('drag-over');
  });
  navItem.addEventListener('dragleave', () => {
    navItem.classList.remove('drag-over');
  });
  navItem.addEventListener('drop', (e) => {
    e.preventDefault();
    navItem.classList.remove('drag-over');
    const rawId = e.dataTransfer.getData('text/plain');
    const noteId = isNaN(rawId) ? rawId : parseInt(rawId);
    handleMoveNoteToCategory(noteId, categoryId);
  });
});

// ----------------------------------------------------------------------------
// D4. 搜索与排序
// ----------------------------------------------------------------------------

// 搜索输入
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    currentSearchKeyword = e.target.value.trim();
    renderNoteList(); // 重新渲染列表会读取 keyword
  });
}

// 排序按钮切换
if (sortActionBtn) {
  sortActionBtn.addEventListener('click', () => {
    // 循环切换：时间倒序 -> 时间正序 -> 标题排序
    if (currentSortMode === 'timeDesc') {
      currentSortMode = 'timeAsc';
      sortActionBtn.innerHTML = '按时间正序 <i class="fa-solid fa-arrow-up"></i>';
    } else if (currentSortMode === 'timeAsc') {
      currentSortMode = 'titleAsc';
      sortActionBtn.innerHTML = '按标题名称 <i class="fa-solid fa-arrow-down-a-z"></i>';
    } else {
      currentSortMode = 'timeDesc';
      sortActionBtn.innerHTML = '按编辑时间 <i class="fa-solid fa-caret-down"></i>';
    }
    renderNoteList();
  });
}

// ============================================================================
// 【模块E】编辑器集成 ✏️ (Editor)
// ============================================================================

// ----------------------------------------------------------------------------
// E1. EasyMDE初始化
// ----------------------------------------------------------------------------

let easyMDE = null;

// 检查页面是否存在编辑器元素，避免报错
if (editorContent) {
  easyMDE = new EasyMDE({
    element: editorContent,
    spellChecker: false,
    status: false, // 底部状态栏
    autofocus: false,
    hideIcons: ['fullscreen', 'side-by-side'], // 隐藏可能有bug的模式

    // ------------------------------------------------------------------------
    // E2. 自定义工具栏
    // ------------------------------------------------------------------------
    toolbar: [
      {
        name: "bold",
        action: EasyMDE.toggleBold,
        className: "fa fa-bold",
        title: "加粗 Ctrl+B"
      },
      {
        name: "italic",
        action: EasyMDE.toggleItalic,
        className: "fa fa-italic",
        title: "斜体 Ctrl+I"
      },
      {
        name: "strikethrough",
        action: EasyMDE.toggleStrikethrough,
        className: "fa fa-strikethrough",
        title: "删除线"
      },
      "|",
      {
        name: "heading-1",
        action: EasyMDE.toggleHeading1,
        className: "fa fa-header fa-heading-1",
        title: "一级标题"
      },
      {
        name: "heading-2",
        action: EasyMDE.toggleHeading2,
        className: "fa fa-header fa-heading-2",
        title: "二级标题"
      },
      {
        name: "heading-3",
        action: EasyMDE.toggleHeading3,
        className: "fa fa-header fa-heading-3",
        title: "三级标题"
      },
      "|",
      {
        name: "quote",
        action: EasyMDE.toggleBlockquote,
        className: "fa fa-quote-left",
        title: "引用"
      },
      {
        name: "unordered-list",
        action: EasyMDE.toggleUnorderedList,
        className: "fa fa-list-ul",
        title: "无序列表"
      },
      {
        name: "ordered-list",
        action: EasyMDE.toggleOrderedList,
        className: "fa fa-list-ol",
        title: "有序列表"
      },
      "|",
      {
        name: "code",
        action: EasyMDE.toggleCodeBlock,
        className: "fa fa-code",
        title: "代码块"
      },
      {
        name: "link",
        action: EasyMDE.drawLink,
        className: "fa fa-link",
        title: "插入链接 Ctrl+K"
      },

      // ----------------------------------------------------------------------
      // E3. 图片上传 (本地图片转 Base64)
      // ----------------------------------------------------------------------
      {
        name: "upload-image",
        action: function uploadImage(editor) {
          // 创建隐藏的文件输入
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              // 限制大小 500KB
              if (file.size > 500 * 1024) {
                alert('图片大小不能超过500KB，请选择更小的图片');
                return;
              }

              // 读取并转 Base64
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target.result;
                const cm = editor.codemirror;
                const pos = cm.getCursor();
                const imageMarkdown = `![${file.name}](${base64})`;

                // 插入代码
                cm.replaceRange(imageMarkdown, pos);

                // 🔥 手动触发保存 (修复图片上传不自动保存的问题)
                CodeMirror.signal(cm, "change", cm);
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        },
        className: "fa fa-image",
        title: "上传图片(本地)"
      },
      "|",

      // ----------------------------------------------------------------------
      // E4. 预览模式
      // ----------------------------------------------------------------------
      {
        name: "preview",
        action: function customPreview(editor) {
          const container = document.querySelector('.editor-container');
          const previewArea = document.getElementById('note-preview-area');
          const isPreview = container.classList.contains('preview-mode');

          // 找到工具栏上的按钮
          const previewBtn = document.querySelector('.editor-toolbar .fa-eye') ||
            document.querySelector('.editor-toolbar .fa-pen');

          if (isPreview) {
            // A. 退出预览 -> 变回编辑模式
            container.classList.remove('preview-mode');
            editorTitle.disabled = false;

            // 🔄 图标变回“眼睛”
            if (previewBtn) {
              previewBtn.classList.remove('fa-pen');
              previewBtn.classList.add('fa-eye');
              previewBtn.title = "预览";
            }
          } else {
            // B. 进入预览模式
            container.classList.add('preview-mode');
            // 使用 marked 库渲染 HTML
            if (typeof marked !== 'undefined') {
              previewArea.innerHTML = marked.parse(editor.value() || '# 无内容');
            } else {
              previewArea.innerHTML = '<p style="color:red">Marked.js 库未加载</p>';
            }
            editorTitle.disabled = true;

            // 🔄 图标变成“笔”
            if (previewBtn) {
              previewBtn.classList.remove('fa-eye');
              previewBtn.classList.add('fa-pen');
              previewBtn.title = "返回编辑";
            }
          }
        },
        className: "fa fa-eye", // 初始图标
        title: "预览"
      },
      "|",
      {
        name: "toggle-sidebar",
        action: function toggleSidebar(editor) {
          const sidebar = document.querySelector('.sidebar');
          const listView = document.querySelector('.list-view');

          if (sidebar && listView) {
            sidebar.classList.toggle('collapsed');
            listView.classList.toggle('collapsed');

            // 刷新CodeMirror以适应新宽度
            setTimeout(() => {
              if (editor && editor.codemirror) {
                editor.codemirror.refresh();
              }
            }, 300);
          }
        },
        className: "fa fa-bars",
        title: "收起/展开侧边栏"
      }
    ],
    placeholder: "开始记录你的想法...",
    shortcuts: {
      toggleFullScreen: null, // 禁用可能冲突的快捷键
      toggleSideBySide: null
    },
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: true,
    minHeight: "300px"
  });

  // 设置撤销延迟
  easyMDE.codemirror.setOption("historyEventDelay", 200);

  // 【关键 UI 逻辑】把 EasyMDE 的工具栏搬到最上面的 .toolbar 容器里
  // 这样可以让工具栏和标题栏融为一体
  const easyMDEToolbar = document.querySelector('.editor-toolbar');
  const mainToolbar = document.querySelector('.toolbar');
  const rightTools = document.querySelector('.tool-right');

  if (easyMDEToolbar && mainToolbar && rightTools) {
    // 移除默认边框和背景，让它融入主工具栏
    easyMDEToolbar.style.border = 'none';
    easyMDEToolbar.style.borderRadius = '0';
    easyMDEToolbar.style.backgroundColor = 'transparent';
    easyMDEToolbar.style.padding = '0';

    // 插入到主工具栏左侧
    mainToolbar.insertBefore(easyMDEToolbar, rightTools);
  }

  // 修复初始化时的高度问题
  setTimeout(() => {
    if (easyMDE && easyMDE.codemirror) {
      easyMDE.codemirror.refresh();
    }
  }, 100);

  // ===========================================
  // 💾 数据同步逻辑 (核心：静默保存，不跳动)
  // ===========================================
  easyMDE.codemirror.on("change", () => {
    // 🔒 如果锁是锁着的，说明是系统在加载笔记，不是人在打字，直接忽略
    if (isLoadingNote) return;

    const val = easyMDE.value();
    if (currentNoteId) {
      const note = notes.find(n => n.id == currentNoteId);

      if (note) {
        // 1. 更新内存数据
        note.content = val;
        note.updateTime = Date.now();

        // 2. 存进硬盘
        saveAllToLocalStorage();

        // 3. 手动更新左侧列表的 UI (不调用renderNoteList重排，防止列表跳动)
        // 尝试找到当前 active 的 li
        const activeItem = document.querySelector('.note-item.active');

        if (activeItem) {
          // A. 更新预览文字 (简单的去除 Markdown 符号)
          const previewDiv = activeItem.querySelector('.note-preview');
          if (previewDiv) {
            const plainText = val.replace(/[#*`]/g, '').replace(/\n/g, ' ').substring(0, 50);
            previewDiv.textContent = plainText || '无内容';
          }

          // B. 更新时间为"刚刚"
          const dateDiv = activeItem.querySelector('.note-date');
          if (dateDiv) {
            dateDiv.textContent = '刚刚';
          }
        }
      }
    }
  });

  // ===========================================
  // 📋 支持粘贴图片 (Ctrl+V)
  // ===========================================
  easyMDE.codemirror.on("paste", function (editor, e) {
    if (!(e.clipboardData && e.clipboardData.items)) return;

    for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
      let item = e.clipboardData.items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault(); // 阻止默认粘贴行为

        let blob = item.getAsFile();
        let reader = new FileReader();

        reader.onload = function (event) {
          const base64 = event.target.result;
          const markdownImage = `\n![粘贴的图片](${base64})\n`;

          // 1. 插入 Markdown 代码
          editor.replaceSelection(markdownImage);

          // 2. 🔥 修复：粘贴完立马手动触发 change 事件，确保保存！
          CodeMirror.signal(editor, "change", editor);
        };

        reader.readAsDataURL(blob);
        return; // 处理完图片就退出
      }
    }
  });
}

// ============================================================================
// 【模块F】高级功能 🚀 (Advanced)
// ============================================================================

// ----------------------------------------------------------------------------
// F1. 私密笔记
// ----------------------------------------------------------------------------

/**
 * 私密笔记访问控制
 * 首次访问：设置密码
 * 再次访问：输入密码验证
 * @param {string} targetId - 目标分类ID
 * @param {string} targetName - 目标分类名称
 */
function handlePrivateAccess(targetId, targetName) {
  // 1. 检查 LocalStorage 有无存过密码
  const savedPassword = localStorage.getItem('private_password');

  if (!savedPassword) {
    // a. 如果没有存过 -> 第一次使用，提示设置密码
    showModal('设置私密密码', '请设置4-10位访问密码(请牢记)', (inputVal) => {
      if (!inputVal) {
        alert("密码不能为空!");
        return;
      }

      // 长度限制
      if (inputVal.length < 4 || inputVal.length > 10) {
        alert("密码长度必须在 4 到 10 之间");
        // 重新弹窗让用户设置
        setTimeout(() => handlePrivateAccess(targetId, targetName), 100);
        return;
      }

      localStorage.setItem('private_password', inputVal);
      alert('密码设置成功, 请牢记!');
      switchCategory(targetId, targetName);
    });

  } else {
    // b. 如果存过 -> 提示输入密码问题
    showModal('私密笔记已锁定', '请输入密码解锁', (inputVal) => {
      if (inputVal === savedPassword) {
        switchCategory(targetId, targetName);
      } else {
        alert('密码错误, 请重试!');
      }
    });
  }
}

// ----------------------------------------------------------------------------
// F2. 右键菜单（文件夹重命名、删除）
// ----------------------------------------------------------------------------

const ctxMenu = document.getElementById('folder-context-menu');
const ctxRenameBtn = document.getElementById('ctx-rename');
const ctxDeleteBtn = document.getElementById('ctx-delete');
let ctxTargetId = null; // 存储当前右键点击的文件夹ID

/**
 * 显示右键菜单
 * @param {Event} e - 鼠标事件
 * @param {string} categoryId - 文件夹ID
 */
function showContextMenu(e, categoryId) {
  ctxTargetId = categoryId;

  // 计算位置 (防止菜单跑出屏幕，这里简单跟随鼠标)
  ctxMenu.style.left = `${e.pageX}px`;
  ctxMenu.style.top = `${e.pageY}px`;
  ctxMenu.style.display = 'block';
}

/**
 * 隐藏右键菜单（点击页面其他地方时）
 */
document.addEventListener('click', () => {
  if (ctxMenu) ctxMenu.style.display = 'none';
});

/**
 * 绑定功能：重命名文件夹
 */
if (ctxRenameBtn) {
  ctxRenameBtn.addEventListener('click', () => {
    if (!ctxTargetId) return;

    const category = categories.find(c => c.id === ctxTargetId);
    if (!category) return;

    // 复用自定义弹窗
    showModal('重命名文件夹', '请输入新名称', (newName) => {
      if (newName === category.name) return; // 没变就不动

      category.name = newName;
      saveAllToLocalStorage();
      renderFolderList(); // 刷新列表名字

      // 如果当前正选着这个文件夹，标题也要变
      if (currentCategoryId === ctxTargetId) {
        listTitleEl.textContent = newName;
      }
    });

    // 小技巧：弹窗出来后，把旧名字填进去，方便修改
    setTimeout(() => {
      if (modalInput) {
        modalInput.value = category.name;
        modalInput.select(); // 自动全选文字
      }
    }, 50);
  });
}

/**
 * 绑定功能：删除文件夹
 */
if (ctxDeleteBtn) {
  ctxDeleteBtn.addEventListener('click', () => {
    if (!ctxTargetId) return;

    const category = categories.find(c => c.id === ctxTargetId);
    if (category) {
      handleDeleteFolder(category); // 调用模块D中的删除函数
    }
  });
}

// ----------------------------------------------------------------------------
// F3. 编辑器重置功能
// ----------------------------------------------------------------------------

/**
 * 强力清空编辑器（修复删除后残留问题）
 * 功能：退出预览模式、清空输入框、清空EasyMDE、恢复图标状态
 */
function resetEditor() {
  // 1. 退出预览模式
  const container = document.querySelector('.editor-container');
  const previewArea = document.getElementById('note-preview-area');
  if (container) container.classList.remove('preview-mode');
  if (previewArea) previewArea.innerHTML = ''; // 清空预览HTML

  // 2. 清空输入框
  editorTitle.value = '';
  if (typeof editorContent !== 'undefined' && editorContent) editorContent.value = '';
  editorTitle.disabled = false; // 恢复可编辑

  // 3. 清空 EasyMDE (核心)
  if (typeof easyMDE !== 'undefined' && easyMDE) {
    easyMDE.value("");
    // 修复：有些时候 clear 之后 placeholder 不显示，强制刷新一下
    setTimeout(() => {
      if (easyMDE.codemirror) easyMDE.codemirror.refresh();
    }, 10);
  }

  // 4. 图标恢复为“预览” (眼睛)
  const previewBtn = document.querySelector('.editor-toolbar .fa-pen');
  if (previewBtn) {
    previewBtn.classList.remove('fa-pen');
    previewBtn.classList.add('fa-eye');
    previewBtn.title = "预览";
  }

  // 5. 状态置空
  currentNoteId = null;
}

// ----------------------------------------------------------------------------
// F4. 体验优化
// ----------------------------------------------------------------------------

// 标题栏按“下箭头/回车”跳到正文
const noteTitleInput = document.getElementById('note-title');

if (noteTitleInput) {
  noteTitleInput.addEventListener('keydown', (e) => {
    // 监听 "ArrowDown"(下箭头) 和 "Enter"(回车)
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();

      // 检查编辑器是否存在
      if (typeof easyMDE !== 'undefined' && easyMDE && easyMDE.codemirror) {
        easyMDE.codemirror.focus(); // 核心：聚焦到编辑器
        easyMDE.codemirror.setCursor(0, 0); // 把光标定在正文开头
      }
    }
  });
}

// ----------------------------------------------------------------------------
// F5. 主题切换 (深色模式)
// ----------------------------------------------------------------------------

/**
 * 初始化主题：从 localStorage 读取用户偏好
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon(true);
  } else {
    document.documentElement.removeAttribute('data-theme');
    updateThemeIcon(false);
  }
}

/**
 * 更新主题切换按钮图标
 * @param {boolean} isDark - 是否为深色模式
 */
function updateThemeIcon(isDark) {
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      if (isDark) {
        icon.className = 'fa-solid fa-sun'; // 深色模式显示太阳
      } else {
        icon.className = 'fa-solid fa-moon'; // 浅色模式显示月亮
      }
    }
  }
}

/**
 * 切换主题（深色模式 <-> 浅色模式）
 */
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    updateThemeIcon(false);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    updateThemeIcon(true);
  }
}

// 绑定点击事件
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', toggleTheme);
}

// ----------------------------------------------------------------------------
// F6. 移动端适配逻辑
// ---------------------------------------------------------------------------- 

// 1. 点击菜单按钮 -> 切换侧边栏
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// 2. 点击侧边栏里的任意项 -> 自动收起侧边栏 (已在 switchCategory 处理，此处为兜底)
sidebar.addEventListener('click', (e) => {
  if (window.innerWidth <= 768 && e.target.closest('.nav-item')) {
    sidebar.classList.remove('open');
  }
});

// 3. 点击返回按钮 -> 退出编辑模式，回到列表
if (mobileBackBtn) {
  mobileBackBtn.addEventListener('click', () => {
    appContainer.classList.remove('mobile-editing');
    // 可选：清空选中状态
    currentNoteId = null;
    const activeItem = document.querySelector('.note-item.active');
    if (activeItem) activeItem.classList.remove('active');
  });
}

// ============================================================================
// 🚀 应用初始化 (Application Bootstrap)
// ============================================================================

// 1. 渲染文件夹和笔记列表
renderFolderList();
renderNoteList();

// 2. 初始化主题
initTheme();

// 3. 为静态导航项添加拖放目标功能（全部、未分类等）
// 这些项不在 renderFolderList 中生成，所以需要单独绑定
const staticNavItems = document.querySelectorAll('.nav-item[data-id]');
staticNavItems.forEach(navItem => {
  const categoryId = navItem.dataset.id;

  // 跳过不能接收笔记的分类
  if (['all', 'todo-unfinished', 'todo-finished'].includes(categoryId)) return;

  navItem.addEventListener('dragover', (e) => {
    e.preventDefault();
    navItem.classList.add('drag-over');
  });
  navItem.addEventListener('dragleave', () => {
    navItem.classList.remove('drag-over');
  });
  navItem.addEventListener('drop', (e) => {
    e.preventDefault();
    navItem.classList.remove('drag-over');
    const rawId = e.dataTransfer.getData('text/plain');
    const noteId = isNaN(rawId) ? rawId : parseInt(rawId);
    handleMoveNoteToCategory(noteId, categoryId);
  });
});

// ============================================================================
// 文件结束
// ============================================================================