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

// 数据定义 模拟数据库 + LocalStorage
// 定义一个默认的初始数据集
const defaultNotes = [
  { 
    id: 1, 
    title: "欢迎使用", 
    content: "试着新建一个文件夹，把这条笔记拖进去（假装拖拽，其实是移动）...", 
    updateTime: "刚刚", 
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
// 优先从 LocalStorage 获取数据
// 如果没有数据，则使用默认数据
let notes = JSON.parse(localStorage.getItem('notes')) || defaultNotes;
let categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;

// 当前状态
let currentCategoryId = "all";
let currentNoteId = null;

// DOM元素获取

// 侧边栏相关
const sidebar = document.querySelector('.sidebar'); // 左侧整个侧边栏(用于事件委托)
const folderListEl = document.getElementById('folder-list'); // 自定义文件夹列表容器
const addFolderBtn = document.getElementById('add-folder-btn'); // 左侧新增文件夹按钮
const listTitleEl = document.querySelector('.list-header-top h2'); // 中间顶部标题
// const navItems = document.querySelectorAll('.nav-item'); // 左侧导航项

// 中间笔记列表相关
const noteListEl = document.querySelector('.note-list'); // 中间笔记列表容器
const noteCountEl = document.querySelector(".count-text"); // 中间共xx条笔记
const searchInput = document.querySelector('.search-box input'); // 搜索输入框
const addNoteBtn = document.querySelector('.add-circle-btn'); // 中间黄色的新增按钮

// 右侧编辑器相关
const deleteBtn = document.querySelector('.delete-btn'); // 右上角的删除按钮
const editorTitle = document.getElementById('note-title');
const editorContent = document.getElementById('note-content');

// 核心功能函数

// 保存数据到 LocalStorage
// 每次数据变更后调用
function saveAllToLocalStorage() {
  localStorage.setItem('notes', JSON.stringify(notes));
  localStorage.setItem('categories', JSON.stringify(categories));
}

// 渲染左侧"我的文件夹"列表
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

    // 右键点击事件：删除文件夹
    li.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // 阻止默认右键菜单
      handleDeleteFolder(category);
    });

    folderListEl.appendChild(li);
  });

  // 同时更新静态导航项的选中状态（全部、未分类等）
  updateStaticNavHighlight();
}

// 渲染中间笔记列表
function renderNoteList() {
  // 1. 筛选数据
  const filteredNotes = notes.filter(note => {
    // 如果是'all'分类，返回所有笔记
    if (currentCategoryId === "all") return true;
    // 特殊逻辑：如果是待办，这里暂时不做处理，留给未来扩展
    // 否则返回匹配当前分类的笔记
    return note.categoryId === currentCategoryId;
  });

  // 2. 更新顶部统计信息
  if (noteCountEl) {
    noteCountEl.textContent = `共 ${filteredNotes.length} 条笔记`;
  }

  // 3. 清空现有列表
  noteListEl.innerHTML = '';

  // 4. 生成 HTML
  if (filteredNotes.length === 0) {
    noteListEl.innerHTML = '<div style="text-align:center; color:#999; padding:20px; font-size:14px;">暂无笔记</div>';
    return;
  }

  filteredNotes.forEach(note => {
    // 创建 li 元素
    const li = document.createElement('li');
    li.className = 'note-item';

    // 如果是当前选中的笔记，添加 active 类
    if (note.id === currentNoteId) {
      li.classList.add('active');
    }

    // 设置内部 HTML
    li.innerHTML = `
      <div class="note-title">${note.title || '无标题'}</div>
      <div class="note-preview">${note.content || '无内容'}</div>
      <div class="note-date">${note.updateTime}</div>
    `;

    // 绑定点击事件：点击列表项，切换右侧显示
    li.addEventListener('click', () => {
      currentNoteId = note.id;
      renderNoteList(); // 重新渲染列表以更新选中状态
      loadNoteToEditor(note); // 加载笔记到编辑器
    });

    noteListEl.appendChild(li);
  });
}

// 加载笔记到右侧编辑器
function loadNoteToEditor(note) {
  editorTitle.value = note.title;
  editorContent.value = note.content;
}

// 更新静态导航项的选中状态（全部、未分类等）
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

// 交互逻辑处理

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

// A. 侧边栏点击逻辑 (使用事件委托，处理动态生成的元素)
sidebar.addEventListener('click', (e) => {
  // 找到被点击的.nav-item元素
  const navItem = e.target.closest('.nav-item');

  if (navItem) {
    const newCategoryId = navItem.dataset.id;
    const categoryName = navItem.querySelector('.text').textContent;

    // 切换分类
    currentCategoryId = newCategoryId;
    currentNoteId = null; // 切换分类时，清除当前选中笔记

    // 更新UI
    listTitleEl.textContent = categoryName; // 更新中间的大标题
    renderFolderList(); // 重新渲染文件夹列表以更新选中状态
    renderNoteList(); // 重新渲染笔记列表

    // 清空右侧编辑器
    editorTitle.value = '';
    editorContent.value = '';
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

// B1. 新增文件夹按钮点击事件
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
}

// C. 删除文件夹处理函数
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

// D. 新增笔记按钮点击事件
if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    // 1. 创建新笔记对象
    const newId = Date.now(); // 使用时间戳作为唯一ID
    // 确定新笔记的分类：如果是全部/未分类，归入未分类；否则归入当前选中的文件夹
    let targetCategoryId = currentCategoryId;
    if (currentCategoryId === "all" || currentCategoryId.startsWith('todo')) {
      targetCategoryId = "uncategorized";
    }

    const newNote = {
      id: newId, 
      title: '新建笔记',
      content: '',
      updateTime: '刚刚',
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

// E. 实时编辑与保存：标题和内容输入框监听
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
      currentNote.updateTime = '刚刚'; // 简化处理

      // 保存数据到 LocalStorage
      saveAllToLocalStorage();
      // 重新渲染笔记列表，更新预览和时间
      renderNoteList();

      // 重绘后焦点可能会丢失，简单处理：保持 focus 状态 (浏览器默认行为通常能保持)
      // 如果发现输入卡顿或焦点丢失，可以优化这里的逻辑
    }
  });
});

// F. 删除笔记按钮点击事件
if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    // 如果没有选中笔记，直接返回
    if (!currentNoteId) {
      alert('请先选择一条要删除的笔记');
      return;
    }

    // 确认删除
    if (confirm('确定要删除这条笔记吗？')) {
      // 1. 从数据数组中删除笔记
      notes = notes.filter(n => n.id !== currentNoteId);
      // 保存数据到 LocalStorage
      saveAllToLocalStorage();

      // 2. 清除当前选中状态
      currentNoteId = null;
      editorTitle.value = '';
      editorContent.value = '';

      // 3. 重新渲染笔记列表
      renderNoteList();
    }
  });
}

//  G. 搜索功能
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();

    // 在当前 DOM 中筛选显示笔记
    const noteItems = document.querySelectorAll('.note-item');
    noteItems.forEach(item => {
      const title = item.querySelector('.note-title').textContent.toLowerCase();
      const content = item.querySelector('.note-preview').textContent.toLowerCase();

      if (title.includes(keyword) || content.includes(keyword)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });
}

// 5. 初始化
renderFolderList();
renderNoteList();