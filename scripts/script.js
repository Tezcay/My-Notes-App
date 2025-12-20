const notes = [
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

let currentCategoryId = "all";
let currentNoteId = null;

// DOM元素获取
const navItems = document.querySelectorAll('.nav-item'); // 左侧导航项
const noteListEl = document.querySelector('.note-list'); // 中间笔记列表容器
const noteCountEl = document.querySelector(".count-text"); // 中间共xx条笔记
const listTitleEl = document.querySelector('.list-header-top h2'); // 中间顶部标题
const searchInput = document.querySelector('.search-box input'); // 搜索输入框

// 右侧编辑器元素
const editorTitle = document.getElementById('note-title');
const editorContent = document.getElementById('note-content');

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