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

// 1. 数据定义 模拟数据库 + LocalStorage
// 定义一个默认的初始数据集
const defaultNotes = [
  {
    id: 1,
    title: "First Note",
    content: "This is the content of the first note.",  
    updateTime: "just now",
    categoryId: "uncategorized"
  }
];

// 优先从 LocalStorage 获取数据
// 如果没有数据，则使用默认数据
let notes = JSON.parse(localStorage.getItem('notes')) || defaultNotes;

// 当前状态
let currentCategoryId = "all";
let currentNoteId = null;

// DOM元素获取
const navItems = document.querySelectorAll('.nav-item'); // 左侧导航项
const noteListEl = document.querySelector('.note-list'); // 中间笔记列表容器
const noteCountEl = document.querySelector(".count-text"); // 中间共xx条笔记
const listTitleEl = document.querySelector('.list-header-top h2'); // 中间顶部标题
const searchInput = document.querySelector('.search-box input'); // 搜索输入框

// 获取按钮元素
const addBtn = document.querySelector('.add-circle-btn'); // 中间黄色的新增按钮
const deleteBtn = document.querySelector('.delete-btn'); // 右上角的删除按钮

// 右侧编辑器元素
const editorTitle = document.getElementById('note-title');
const editorContent = document.getElementById('note-content');

// 核心功能函数

// 保存数据到 LocalStorage
// 每次数据变更后调用
function saveNotesToLocalStorage() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

// 渲染笔记列表
function renderNoteList() {
  // 1. 筛选数据
  const filteredNotes = notes.filter(note => {
    // 如果是'all'分类，返回所有笔记
    if (currentCategoryId === "all") return true;
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

// 事件监听


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

// 新增笔记按钮点击事件
if (addBtn) {
  addBtn.addEventListener('click', () => {
    // 1. 创建新笔记对象
    const newId = Date.now(); // 使用时间戳作为唯一ID
    const newNote = {
      id: newId, 
      title: 'new note',
      content: '',
      updateTime: 'just now',
      // 如果当前分类是'all'，则默认分类为'uncategorized', 否则为当前分类
      categoryId: currentCategoryId === "all" ? "uncategorized" : currentCategoryId 
    };

    // 2. 添加到数据数组最前面
    notes.unshift(newNote); 
    // 保存数据到 LocalStorage
    saveNotesToLocalStorage();

    // 3. 选中这个新笔记
    currentNoteId = newId;

    // 4. 重新渲染笔记列表
    renderNoteList();

    // 5. 加载新笔记到编辑器
    loadNoteToEditor(newNote);

    // 6. 自动聚焦标题输入框, 方便直接输入
    editorTitle.focus();
  });
}

// 实时编辑：标题和内容输入框监听
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
      currentNote.updateTime = 'just now'; // 简化处理，直接设为'just now'

      // 保存数据到 LocalStorage
      saveNotesToLocalStorage();
      // 重新渲染笔记列表，更新预览和时间
      renderNoteList();

      // 重绘后焦点可能会丢失，简单处理：保持 focus 状态 (浏览器默认行为通常能保持)
      // 如果发现输入卡顿或焦点丢失，可以优化这里的逻辑
    }
  });
});

// 删除笔记按钮点击事件
if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    // 如果没有选中笔记，直接返回
    if (!currentNoteId) {
      alert('请先选择要删除的笔记');
      return;
    }

    // 确认删除
    if (confirm('确定要删除这条笔记吗？')) {
      // 1. 从数据数组中删除笔记
      notes = notes.filter(n => n.id !== currentNoteId);
      // 保存数据到 LocalStorage
      saveNotesToLocalStorage();

      // 2. 清除当前选中状态
      currentNoteId = null;
      editorTitle.value = '';
      editorContent.value = '';

      // 3. 重新渲染笔记列表
      renderNoteList();
    }
  });
}

// 搜索功能
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
renderNoteList();