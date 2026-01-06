// ============================================
// 📘 My Notes App - 核心脚本文件
// ============================================
// 版本: 2.0
// 作者: 2023级软件工程专业
// 最后更新: 2026年1月6日
// ============================================

// ============================================
// MODULE A: DATA LAYER 📦 (数据层)
// ============================================
// 负责数据模型定义、LocalStorage操作、状态管理
// ============================================

// A1. 默认数据定义
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

// A2. 数据加载与初始化
// 优先从 LocalStorage 获取数据，如果没有则使用默认数据
let notes = JSON.parse(localStorage.getItem('notes')) || defaultNotes;
let categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;

// 数据迁移：将旧的 "刚刚" 字符串转换为当前时间戳，以便启用相对时间功能
notes.forEach(note => {
  if (note.updateTime === '刚刚') {
    note.updateTime = Date.now();
  }
});
saveAllToLocalStorage(); // 保存修正后的数据

// A3. 全局状态变量
let currentCategoryId = "all"; // 当前选中的分类ID，默认'all'
let currentNoteId = null; // 当前选中的笔记ID
let currentSearchKeyword = ''; // 当前搜索关键词
let currentSortMode = 'timeDesc'; // 当前排序模式: timeDesc, timeAsc, titleAsc
let isLoadingNote = false; // 定义一个加载锁状态

// --- DOM元素获取 ---

// 侧边栏相关
const sidebar = document.querySelector('.sidebar'); // 左侧整个侧边栏(用于事件委托)
const folderListEl = document.getElementById('folder-list'); // 自定义文件夹列表容器
const addFolderBtn = document.getElementById('add-folder-btn'); // 左侧新增文件夹按钮
const listTitleEl = document.querySelector('.list-header-top h2'); // 中间顶部标题
// const navItems = document.querySelectorAll('.nav-item'); // 左侧导航项

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

// ============================================
// MODULE B: UTILITIES 🔧 (工具函数)
// ============================================
// 提供时间格式化、文本高亮等通用工具函数
// ============================================

// B1. 数据持久化
/**
 * 保存所有数据到 LocalStorage
 * @description 每次数据变更后调用此函数进行持久化
 */
function saveAllToLocalStorage() {
  localStorage.setItem('notes', JSON.stringify(notes));
  localStorage.setItem('categories', JSON.stringify(categories));
}

// B2. 时间格式化
/**
 * 将时间戳格式化为人类可读的相对时间
 * @param {number|string} timestamp - 毫秒时间戳或时间字符串
 * @return {string} 格式化后的时间字符串（如"刚刚"、"5分钟前"、"10:30"、"01/15"）
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

// B3. 文本高亮处理
/**
 * 在文本中高亮显示搜索关键词
 * @param {string} text - 原文本
 * @param {string} keyword - 要高亮的关键词
 * @return {string} 包含HTML标签的高亮文本
 */
function highlightText(text, keyword) {
  // 如果没搜词，直接返回原文本
  if (!keyword) return text;

  // 使用正则进行替换 (gi 表示全局 + 忽略大小写)
  const regex = new RegExp(`(${keyword})`, 'gi');

  // 把匹配到的部分变成 绿色+加粗
  return text.replace(regex, '<span style="color: #10B981; font-weight: bold;">$1</span>');
}

// ============================================
// MODULE C: UI RENDER 🎨 (UI渲染层)
// ============================================
// 负责DOM元素渲染、列表更新、界面刷新等
// ============================================

// C1. 渲染文件夹列表
/**
 * 渲染左侧"我的文件夹"列表
 * @description 支持右键菜单、拖拽放置等交互
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

    // 右键点击事件：呼出菜单(修改版)
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
      const noteId = parseInt(e.dataTransfer.getData('text/plain')); // ID可以是字符串
      handleMoveNoteToCategory(noteId, category.id);
    });

    folderListEl.appendChild(li);
  });

  // 同时更新静态导航项的选中状态（全部、未分类等）
  updateStaticNavHighlight();
}

// C2. 渲染笔记列表
/**
 * 渲染中间栏的笔记列表
 * @description 包含搜索过滤、分类筛选、排序、空状态处理、关键词高亮等功能
 */
function renderNoteList() {
  // 1. 联合筛选：既要符合“分类”，又要符合“搜索词”
  const filteredNotes = notes.filter(note => {
    // A. 搜索词筛选
    // 把标题和内容拼在一起搜，只要有一个包含关键词就算匹配
    const contentToSearch = (note.title + note.content).toLowerCase();
    const keyword = currentSearchKeyword.toLowerCase();

    // 如果搜不到，直接淘汰
    if (!contentToSearch.includes(keyword)) return false;

    // B. 分类筛选 
    // 1. 回收站
    if (currentCategoryId === "trash") return note.categoryId === "trash";
    // 2. 不在回收站
    if (note.categoryId === "trash") return false;
    // 3. 在全部笔记里隐藏私密笔记
    if (currentCategoryId === "all") {
      return note.categoryId !== 'private';
    }
    // 4. 其他普通情况
    return note.categoryId === currentCategoryId;
  });

  // 1.5 排序逻辑
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

  // 2. 更新顶部统计
  if (noteCountEl) {
    noteCountEl.textContent = `共 ${filteredNotes.length} 条笔记`;
  }

  // 3. 清空列表
  noteListEl.innerHTML = '';

  // 4. 空状态处理
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

  // 5. 生成列表 (带高亮!)
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
    const displayContent = highlightText(note.content || '无内容', currentSearchKeyword);

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
      document.querySelector('.app').classList.add('mobile-editing');
    });

    noteListEl.appendChild(li);
  });
}

// C3. 更新静态导航高亮
/**
 * 更新静态导航项的选中状态
 * @description 维护全部笔记、未分类、回收站等固定导航项的激活状态
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

// ============================================
// MODULE D: EVENT HANDLERS ⚡ (事件处理层)
// ============================================
// 负责用户交互、事件监听、业务逻辑处理
// ============================================

// D1. 分类切换通用函数
/**
 * 切换当前选中的分类
 * @param {string} id - 分类ID
 * @param {string} name - 分类名称
 * @description 统一处理分类切换逻辑，包括状态更新、UI刷新、编辑器清空等
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
  if (typeof easyMDE !== 'undefined') {
    easyMDE.value("");
  }

  // 4. 手机端自动收起侧边栏
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('open');
  }
}

// A. 侧边栏点击逻辑 (使用事件委托，处理动态生成的元素)
sidebar.addEventListener('click', (e) => {
  // 找到被点击的.nav-item元素
  const navItem = e.target.closest('.nav-item');

  if (navItem) {
    const targetId = navItem.dataset.id;
    const targetName = navItem.querySelector('.text').textContent;

    // 拦截
    if (targetId === 'private') {
      handlePrivateAccess(targetId, targetName);
      return; // 阻止后续切换
    }

    // 普通分类直接切换
    switchCategory(targetId, targetName);
  }
});

// B0. 文件夹列表展开/收起按钮点击事件
const folderToggleBtn = document.getElementById('folder-toggle-btn');
const folderHeader = document.querySelector('.folder-header');

if (folderToggleBtn && folderListEl) {
  folderToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发侧边栏点击事件

    // 1. 切换列表的 collapsed 类
    folderListEl.classList.toggle('collapsed');

    // 2. 切换头部的 collapsed 类 (用于旋转箭头)
    folderHeader.classList.toggle('collapsed');
  });
}

// ============================================
// MODULE F: ADVANCED FEATURES ✨ (高级功能)
// ============================================
// 主题切换、弹窗系统、右键菜单、私密笔记等高级特性
// ============================================

// F1. 自定义弹窗系统
// 支持输入框模式和确认模式的通用弹窗
const modalOverlay = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc'); // 新增
const modalInput = document.getElementById('modal-input');
const modalConfirmBtn = document.getElementById('modal-confirm');
const modalCancelBtn = document.getElementById('modal-cancel');

let onModalConfirm = null;
let isInputMode = true; // 标记当前是输入模式还是纯确认模式

/**
 * 显示输入框弹窗
 * @param {string} title - 弹窗标题
 * @param {string} placeholder - 输入框提示文字
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
 * 显示确认弹窗
 * @param {string} title - 弹窗标题
 * @param {string} message - 确认消息文本
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

// 隐藏弹窗
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

// D2. 新建文件夹事件
// 使用自定义弹窗创建新文件夹
if (addFolderBtn) {
  addFolderBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // 调用刚写的漂亮弹窗
    showModal('新建文件夹', '请输入文件夹名称', (folderName) => {
      // 这里是点确定后执行的逻辑 (和原来一样)
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
// 🔒 定义一个锁，防止加载笔记时触发“修改事件”
// ===========================================

// E2. 加载笔记到编辑器
/**
 * 加载笔记内容到编辑器
 * @param {Object} note - 笔记对象
 * @description 🔒 使用加载锁防止触发自动保存事件
 */
function loadNoteToEditor(note) {
  // 1. 上锁：告诉系统“正在加载，不是用户在打字”
  isLoadingNote = true;

  currentNoteId = note.id;

  // 更新标题输入框
  editorTitle.value = note.title;

  // 更新编辑器内容
  if (easyMDE) {
    easyMDE.value(note.content || "");

    // ⏳ 延迟解锁：等编辑器渲染完了，再把锁打开
    // (这是为了防止 easyMDE 设置值时瞬间触发 change 事件)
    setTimeout(() => {
      isLoadingNote = false;
    }, 200);
  }

  // 移动端逻辑 (保持不变)
  const container = document.querySelector('.editor-container');
  container.classList.remove('preview-mode');
  editorTitle.disabled = false;
}

// D3. 删除文件夹处理
/**
 * 删除文件夹及处理其下的笔记
 * @param {Object} category - 要删除的分类对象
 * @description 删除文件夹时将其下笔记移至"未分类"
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

// D4. 移动笔记到指定分类
/**
 * 拖拽移动笔记到指定分类
 * @param {string|number} noteId - 笔记ID
 * @param {string} categoryId - 目标分类ID
 * @description 支持拖入回收站确认、防止重复移动
 */
function handleMoveNoteToCategory(noteId, categoryId) {
  const note = notes.find(n => n.id === noteId);
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

  // 可选：显示一个简短的提示
  console.log(`笔记 "${note.title}" 已移动到新分类`);
}

// D5. 新增笔记事件
// 创建新笔记并自动分配到当前分类
if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    // 1. 创建新笔记对象
    const newId = String(Date.now()); // 使用时间戳作为唯一ID -> 转换为字符串
    // 确定新笔记的分类：如果是全部/未分类，归入未分类；否则归入当前选中的文件夹
    let targetCategoryId = currentCategoryId;
    if (currentCategoryId === "all" || currentCategoryId.startsWith('todo')) {
      targetCategoryId = "uncategorized";
    }

    const newNote = {
      id: newId,
      title: '新建笔记',
      content: '',
      updateTime: Date.now(),
      // 如果当前分类是'all'，则默认分类为'uncategorized', 否则为当前分类
      categoryId: targetCategoryId
    };

    // 2. 添加到数据数组最前面
    notes.unshift(newNote);
    // 保存数据到 LocalStorage
    saveAllToLocalStorage();

    // 3. 选中这个新笔记
    currentNoteId = newId;
    // 如果当前在“全部”视图，或者就在目标视图，直接渲染
    // 如果当前在别的视图（很少见），为了体验，强行切过去也行，这里保持当前视图逻辑

    // 4. 重新渲染笔记列表
    renderNoteList();

    // 5. 加载新笔记到编辑器
    loadNoteToEditor(newNote);

    // 6. 自动聚焦标题输入框, 方便直接输入
    editorTitle.focus();
  });
}

// D6. 标题输入实时保存
// 监听标题变化并即时保存
if (editorTitle) {
  editorTitle.addEventListener('input', (e) => {
    if (currentNoteId) {
      const note = notes.find(n => n.id === currentNoteId);
      if (note) {
        // 1. 更新内存数据
        note.title = e.target.value;
        note.updateTime = Date.now();

        // 2. 🔥 存进硬盘！
        saveAllToLocalStorage();

        // 3. 只更新左侧列表里当前这一项的文字 (不重排列表)
        const activeTitle = document.querySelector(`.note-item[data-id="${currentNoteId}"] .note-title`);
        if (activeTitle) {
          activeTitle.textContent = note.title || '无标题';
        }
      }
    }
  });
}

// D7. 删除笔记事件
// 支持移入回收站和永久删除两种模式
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
        // 执行删除逻辑
        notes = notes.filter(n => n.id != currentNoteId);
        saveAllToLocalStorage();
        resetEditor(); // 强力清空
        renderNoteList();
      });
      return;
    }

    // 场景 B：移入回收站
    showConfirm('移入回收站', '确定要将这条笔记丢进回收站吗？', () => {
      // 执行移动逻辑
      currentNote.categoryId = "trash";
      currentNote.updateTime = Date.now();
      saveAllToLocalStorage();
      resetEditor(); // 强力清空
      renderNoteList();
    });
  });
}

// D8. 搜索功能
// 实时搜索笔记标题和内容
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    // 1. 更新全局搜索词状态
    currentSearchKeyword = e.target.value.trim();

    // 2. 重新渲染列表 (renderNoteList 会自己去读 currentSearchKeyword)
    renderNoteList();
  });
}

// D9. 排序切换功能
// 在时间倒序/正序/标题排序之间循环切换
if (sortActionBtn) {
  sortActionBtn.addEventListener('click', () => {
    // Cycle: timeDesc -> timeAsc -> titleAsc -> timeDesc
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

// F5. 移动端响应式适配
// 手机端侧边栏抽屉、编辑模式切换等
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileBackBtn = document.getElementById('mobile-back-btn');
const appContainer = document.querySelector('.app');

// 1. 点击菜单按钮 -> 切换侧边栏
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// 2. 点击侧边栏里的任意项 -> 自动收起侧边栏
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

// 5. 初始化
renderFolderList();
renderNoteList();

// 6. 为静态导航项添加拖放目标功能（全部、未分类等）
const staticNavItems = document.querySelectorAll('.nav-item[data-id]');
staticNavItems.forEach(navItem => {
  const categoryId = navItem.dataset.id;

  // 跳过不能接收笔记的分类（如待办、私密等）
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
    const noteId = parseInt(e.dataTransfer.getData('text/plain'));
    handleMoveNoteToCategory(noteId, categoryId);
  });
});

// F2. 主题切换系统
// 深色/浅色模式切换，自动保存用户偏好
const themeToggleBtn = document.getElementById('theme-toggle-btn');

/**
 * 初始化主题
 * @description 从localStorage读取用户主题偏好并应用
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
 * 更新主题按钮图标
 * @param {boolean} isDark - 是否为深色模式
 */
function updateThemeIcon(isDark) {
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('i');
    if (isDark) {
      icon.className = 'fa-solid fa-sun'; // 深色模式显示太阳
    } else {
      icon.className = 'fa-solid fa-moon'; // 浅色模式显示月亮
    }
  }
}

/**
 * 切换主题模式
 * @description 在深色和浅色模式之间切换，并保存偏好到localStorage
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

// 页面加载时初始化主题
initTheme();

// ============================================
// MODULE E: EDITOR INTEGRATION 📝 (编辑器集成)
// ============================================
// EasyMDE Markdown编辑器的初始化、配置、事件处理
// ============================================

// E2. 加载笔记到编辑器
/**
 * 加载笔记内容到编辑器
 * @param {Object} note - 笔记对象
 * @description 🔒 使用加载锁防止触发自动保存事件
 */
function loadNoteToEditor(note) {
  // 1. 上锁：告诉系统"正在加载，不是用户在打字"
  isLoadingNote = true;

  currentNoteId = note.id;

  // 更新标题输入框
  editorTitle.value = note.title;

  // 更新编辑器内容
  if (easyMDE) {
    easyMDE.value(note.content || "");

    // ⏳ 延迟解锁：等编辑器渲染完了，再把锁打开
    // (这是为了防止 easyMDE 设置值时瞬间触发 change 事件)
    setTimeout(() => {
      isLoadingNote = false;
    }, 200);
  }

  // 移动端逻辑 (保持不变)
  const container = document.querySelector('.editor-container');
  container.classList.remove('preview-mode');
  editorTitle.disabled = false;
}

// E3. 内容实时保存监听
// 监听标题和内容的输入变化，自动保存
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

// E4. EasyMDE编辑器初始化
let easyMDE = null;

if (document.getElementById('note-content')) {
  easyMDE = new EasyMDE({
    element: document.getElementById('note-content'),
    spellChecker: false,
    status: false,
    autofocus: false,
    hideIcons: ['fullscreen', 'side-by-side'], // 只隐藏有问题的side-by-side
    // 自定义工具栏配置
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
              // 检查文件大小（限制500KB）
              if (file.size > 500 * 1024) {
                alert('图片大小不能超过500KB，请选择更小的图片');
                return;
              }

              // 读取图片并转为base64
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target.result;
                const cm = editor.codemirror;
                const pos = cm.getCursor();
                const imageMarkdown = `![${file.name}](${base64})`;
                cm.replaceRange(imageMarkdown, pos);
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
      {
        name: "preview",
        action: function customPreview(editor) {
          const container = document.querySelector('.editor-container');
          const previewArea = document.getElementById('note-preview-area');
          const isPreview = container.classList.contains('preview-mode');

          // 1. 找到预览按钮 (无论它现在是眼睛还是笔，都能找到)
          const previewBtn = document.querySelector('.editor-toolbar .fa-eye') ||
            document.querySelector('.editor-toolbar .fa-pen');

          if (isPreview) {
            // A. 退出预览 -> 变回编辑模式
            container.classList.remove('preview-mode');
            editorTitle.disabled = false;

            // 🔄 图标变回“眼睛”
            if (previewBtn) {
              previewBtn.classList.remove('fa-pen'); // 移除笔
              previewBtn.classList.add('fa-eye');    // 加上眼睛
              previewBtn.title = "预览";             // 提示文字也能改
            }

          } else {
            // B. 进入预览模式
            container.classList.add('preview-mode');
            previewArea.innerHTML = marked.parse(editor.value() || '# 无内容');
            editorTitle.disabled = true;

            // 🔄 图标变成“笔” (代表去编辑)
            if (previewBtn) {
              previewBtn.classList.remove('fa-eye'); // 移除眼睛
              previewBtn.classList.add('fa-pen');    // 加上笔
              previewBtn.title = "返回编辑";
            }
          }
        },
        className: "fa fa-eye", // 初始状态是眼睛
        title: "预览"
      },
      "|",
      {
        name: "toggle-sidebar",
        action: function toggleSidebar(editor) {
          const sidebar = document.querySelector('.sidebar');
          const listView = document.querySelector('.list-view');
          sidebar.classList.toggle('collapsed');
          listView.classList.toggle('collapsed');

          // 刷新CodeMirror以适应新宽度
          setTimeout(() => {
            if (editor && editor.codemirror) {
              editor.codemirror.refresh();
            }
          }, 300);
        },
        className: "fa fa-bars",
        title: "收起/展开侧边栏"
      }
    ],
    placeholder: "开始记录你的想法...",
    // 禁用可能导致冲突的快捷键
    shortcuts: {
      toggleFullScreen: null,
      toggleSideBySide: null
    },
    // 其他配置
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: true,
    minHeight: "300px"
  });

  // 设置撤销延迟
  easyMDE.codemirror.setOption("historyEventDelay", 200);

  // 【关键代码】把 EasyMDE 的工具栏搬到最上面的 .toolbar 里
  const easyMDEToolbar = document.querySelector('.editor-toolbar');
  const mainToolbar = document.querySelector('.toolbar');
  const rightTools = document.querySelector('.tool-right');

  if (easyMDEToolbar && mainToolbar && rightTools) {
    // 移除 EasyMDE 默认样式
    easyMDEToolbar.style.border = 'none';
    easyMDEToolbar.style.borderRadius = '0';
    easyMDEToolbar.style.backgroundColor = 'transparent';
    easyMDEToolbar.style.padding = '0';

    // 把工具栏插入到主工具栏左侧
    mainToolbar.insertBefore(easyMDEToolbar, rightTools);
  }

  // 修复 CodeMirror 高度自适应
  setTimeout(() => {
    if (easyMDE && easyMDE.codemirror) {
      easyMDE.codemirror.refresh();
    }
  }, 100);

  // ===========================================
  // 💾 数据同步逻辑 (修复版：静默保存，不跳动)
  // ===========================================
  easyMDE.codemirror.on("change", () => {
    // 🔒 如果锁是锁着的，说明是系统在加载，不是人在打字，直接无视
    if (isLoadingNote) return;

    const val = easyMDE.value();
    if (currentNoteId) {
      const note = notes.find(n => n.id == currentNoteId); // 数字和字符串统一

      if (note) {
        // 更新内容和时间
        note.content = val;
        note.updateTime = Date.now();

        // 关键修改：只保存数据，不重绘列表！
        // renderNoteList();  
        // 这样你在打字时，左侧列表就不会动了。

        saveAllToLocalStorage();

        // 核心修复：手动更新左侧列表的 UI (不重排)
        const noteItem = document.querySelector(`.note-item[data-id="${currentNoteId}"]`); // 假设你给li加了data-id
        // 如果你的 li 没有 data-id，可能需要改 renderNoteList 给它加上，或者通过其他方式找

        // 这里假设 renderNoteList 里生成的 li 还没有 data-id，我们需要去 renderNoteList 加一行代码！
        // 暂时先用这一招：
        // 尝试找到当前 active 的 li (因为正在编辑的肯定是被选中的)
        const activeItem = document.querySelector('.note-item.active');

        if (activeItem) {
          // A. 更新预览文字 (提取前30个字)
          const previewDiv = activeItem.querySelector('.note-preview');
          if (previewDiv) {
            // 简单的去除 Markdown 符号逻辑
            const plainText = val.replace(/[#*`]/g, '').replace(/\n/g, ' ').substring(0, 50);
            // 如果有搜索词，记得高亮(这里简单处理，直接显示文字)
            previewDiv.textContent = plainText || '无内容';
          }

          // B. 更新时间
          const dateDiv = activeItem.querySelector('.note-date');
          if (dateDiv) {
            dateDiv.textContent = '刚刚';
          }
        }
      }
    }
  });

  // 支持粘贴图片(Ctrl+V)
  easyMDE.codemirror.on("paste", function (editor, e) {
    if (!(e.clipboardData && e.clipboardData.items)) return;
    for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
      let item = e.clipboardData.items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        let blob = item.getAsFile();
        let reader = new FileReader();
        reader.onload = function (event) {
          let base64 = event.target.result;
          let markdownImage = `\n![粘贴的图片](${base64})\n`;
          editor.replaceSelection(markdownImage);
          reader.onload = function (event) {
            let base64 = event.target.result;
            let markdownImage = `\n![粘贴的图片](${base64})\n`;
            editor.replaceSelection(markdownImage);

            // 新增：粘贴完图片，立马触发一次保存！
            // 手动触发 change 事件，让上面的同步逻辑工作
            CodeMirror.signal(editor, "change", editor);
          };
        };
        reader.readAsDataURL(blob);
        return;
      }
    }
  });
}


const undoBtn = document.getElementById('undo-btn');

if (undoBtn) {
  undoBtn.addEventListener('click', () => {
    // 检查编辑器是否已加载
    if (easyMDE && easyMDE.codemirror) {
      // 调用 CodeMirror 底层的撤销功能
      easyMDE.codemirror.undo();
      // 聚焦回编辑器
      easyMDE.codemirror.focus();
    }
  });
}

// F3. 私密笔记系统
/**
 * 处理私密笔记访问验证
 * @param {string} targetId - 目标分类ID
 * @param {string} targetName - 目标分类名称
 * @description 首次访问设置密码，后续访问需验证密码
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

      // 新增：长度限制
      if (inputVal.length < 4 || inputVal.length > 10) {
        alert("密码长度必须在 4 到 10 之间");
        // 重新弹窗让用户设置(简单粗暴的重试机制)
        setTimeout(() => handlePrivateAccess(targetId, targetName), 100);
        return;
      }

      localStorage.setItem('private_password', inputVal);
      alert('密码设置成功, 请牢记!');
      switchCategory(targetId, targetName);
      /* if (inputVal) {
        localStorage.setItem('private_password', inputVal);
        switchCategory(targetId, targetName); // 设置完直接进入
      } */
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

// ===========================================
// 🎹 体验优化：标题栏按“下箭头/回车”跳到正文
// ===========================================
const noteTitleInput = document.getElementById('note-title');

if (noteTitleInput) {
  noteTitleInput.addEventListener('keydown', (e) => {
    // 监听 "ArrowDown"(下箭头) 和 "Enter"(回车)
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault(); // 阻止默认行为 (比如回车不用真的在标题里换行)

      // 检查编辑器是否存在
      if (typeof easyMDE !== 'undefined' && easyMDE.codemirror) {
        easyMDE.codemirror.focus(); // 核心：聚焦到编辑器
        easyMDE.codemirror.setCursor(0, 0); // (可选) 把光标定在正文开头
      }
    }
  });
}

// F4. 右键菜单系统
// 文件夹右键菜单：重命名和删除功能
const ctxMenu = document.getElementById('folder-context-menu');
const ctxRenameBtn = document.getElementById('ctx-rename');
const ctxDeleteBtn = document.getElementById('ctx-delete');
let ctxTargetId = null; // 存一下当前右键点的是哪个文件夹

// 1. 显示菜单
function showContextMenu(e, categoryId) {
  ctxTargetId = categoryId;

  // 计算位置 (防止菜单跑出屏幕，这里简单跟随鼠标)
  ctxMenu.style.left = `${e.pageX}px`;
  ctxMenu.style.top = `${e.pageY}px`;
  ctxMenu.style.display = 'block';
}

// 2. 隐藏菜单 (点击页面任何其他地方)
document.addEventListener('click', () => {
  if (ctxMenu) ctxMenu.style.display = 'none';
});

// 3. 绑定功能：重命名
if (ctxRenameBtn) {
  ctxRenameBtn.addEventListener('click', () => {
    if (!ctxTargetId) return;

    const category = categories.find(c => c.id === ctxTargetId);
    if (!category) return;

    // 复用你的漂亮弹窗
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
    }, 50); // 稍微延迟一点点等弹窗渲染
  });
}

// 4. 绑定功能：删除
if (ctxDeleteBtn) {
  ctxDeleteBtn.addEventListener('click', () => {
    if (!ctxTargetId) return;

    const category = categories.find(c => c.id === ctxTargetId);
    if (category) {
      handleDeleteFolder(category); // 调用你原来的删除函数
    }
  });
}

// E3. 重置编辑器
/**
 * 强力清空编辑器所有内容
 * @description 删除笔记后调用，清除标题、内容、预览区域、状态
 */
function resetEditor() {
  // 1. 退出预览模式
  const container = document.querySelector('.editor-container');
  const previewArea = document.getElementById('note-preview-area');
  if (container) container.classList.remove('preview-mode');
  if (previewArea) previewArea.innerHTML = ''; // 清空预览HTML

  // 2. 清空输入框
  editorTitle.value = '';
  editorContent.value = '';
  editorTitle.disabled = false; // 恢复可编辑

  // 3. 清空 EasyMDE (核心)
  if (easyMDE) {
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

// ============================================
// 🎉 核心脚本加载完成
// ============================================
// 模块划分：A.数据层 | B.工具函数 | C.渲染层 | D.事件处理 | E.编辑器 | F.高级功能
// 所有功能已按模块组织，便于维护和扩展
// ============================================