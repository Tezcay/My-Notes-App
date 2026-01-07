// ============================================================================
// 【模块D】事件入口 ⚡ (Main)
// ============================================================================

function switchCategory(id, name) {
  currentCategoryId = id;
  currentNoteId = null;
  listTitleEl.textContent = name;
  renderFolderList();
  renderNoteList();
  editorTitle.value = '';
  if (typeof easyMDE !== 'undefined' && easyMDE) easyMDE.value("");
  if (window.innerWidth <= 768) sidebar.classList.remove('open');
}

// 侧边栏点击
sidebar.addEventListener('click', (e) => {
  const navItem = e.target.closest('.nav-item');
  if (navItem) {
    const targetId = navItem.dataset.id;
    const targetName = navItem.querySelector('.text').textContent;
    if (targetId === 'private') { handlePrivateAccess(targetId, targetName); return; }
    switchCategory(targetId, targetName);
  }
});

// 新增文件夹
if (addFolderBtn) {
  addFolderBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showModal('新建文件夹', '请输入文件夹名称', (folderName) => {
      const newCategory = { id: 'folder-' + Date.now(), name: folderName };
      categories.push(newCategory);
      saveAllToLocalStorage();
      renderFolderList();
    });
  });
}

// 新增笔记
if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    const newId = String(Date.now());
    let targetCategoryId = currentCategoryId;
    if (currentCategoryId === "all" || currentCategoryId.startsWith('todo')) targetCategoryId = "uncategorized";

    const newNote = { id: newId, title: '新建笔记', content: '', updateTime: Date.now(), categoryId: targetCategoryId };
    notes.unshift(newNote);
    saveAllToLocalStorage();
    currentNoteId = newId;
    renderNoteList();
    loadNoteToEditor(newNote);
    editorTitle.focus();
  });
}

// 标题实时保存
if (editorTitle) {
  editorTitle.addEventListener('input', (e) => {
    if (currentNoteId) {
      const note = notes.find(n => n.id == currentNoteId);
      if (note) {
        note.title = e.target.value;
        note.updateTime = Date.now();
        saveAllToLocalStorage();
        const activeTitle = document.querySelector(`.note-item[data-id="${currentNoteId}"] .note-title`);
        if (activeTitle) activeTitle.textContent = note.title || '无标题';
      }
    }
  });
}

// 删除笔记
if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    if (!currentNoteId) { alert('请先选择一条要删除的笔记'); return; }
    const currentNote = notes.find(n => n.id == currentNoteId);
    if (!currentNote) return;

    if (currentCategoryId === "trash") {
      showConfirm('永久删除', '确定要永久销毁这条笔记吗？', () => {
        notes = notes.filter(n => n.id != currentNoteId);
        saveAllToLocalStorage();
        resetEditor();
        renderNoteList();
      });
      return;
    }
    showConfirm('移入回收站', '确定要将这条笔记丢进回收站吗？', () => {
      currentNote.categoryId = "trash";
      currentNote.updateTime = Date.now();
      saveAllToLocalStorage();
      resetEditor();
      renderNoteList();
    });
  });
}

// 删除文件夹逻辑
function handleDeleteFolder(category) {
  showConfirm('删除文件夹', `确定要删除文件夹 "${category.name}" 及其所有笔记吗？`, () => {
    notes.forEach(note => { if (note.categoryId === category.id) note.categoryId = 'uncategorized'; });
    categories = categories.filter(c => c.id !== category.id);
    if (currentCategoryId === category.id) { currentCategoryId = 'all'; listTitleEl.textContent = '全部笔记'; }
    saveAllToLocalStorage();
    renderFolderList();
    renderNoteList();
  });
}

// 拖拽逻辑 (笔记移动)
function handleMoveNoteToCategory(noteId, categoryId) {
  const note = notes.find(n => n.id == noteId);
  if (!note || note.categoryId === categoryId) return;

  const performMove = () => {
    note.categoryId = categoryId;
    note.updateTime = Date.now();
    saveAllToLocalStorage();
    renderNoteList();
  };

  if (categoryId === 'trash') {
    showConfirm('移入回收站', `确定要将笔记 "${note.title}" 丢进回收站吗?`, () => { performMove(); });
    return;
  }
  performMove();
}

// 静态导航拖拽目标
const staticNavItems = document.querySelectorAll('.nav-item[data-id]');
staticNavItems.forEach(navItem => {
  const categoryId = navItem.dataset.id;
  if (['all', 'todo-unfinished', 'todo-finished'].includes(categoryId)) return;
  navItem.addEventListener('dragover', (e) => { e.preventDefault(); navItem.classList.add('drag-over'); });
  navItem.addEventListener('dragleave', () => { navItem.classList.remove('drag-over'); });
  navItem.addEventListener('drop', (e) => {
    e.preventDefault();
    navItem.classList.remove('drag-over');
    const noteId = e.dataTransfer.getData('text/plain');
    handleMoveNoteToCategory(noteId, categoryId);
  });
});

// 搜索
if (searchInput) {
  searchInput.addEventListener('input', (e) => { currentSearchKeyword = e.target.value.trim(); renderNoteList(); });
}

// 排序
if (sortActionBtn) {
  sortActionBtn.addEventListener('click', () => {
    if (currentSortMode === 'timeDesc') { currentSortMode = 'timeAsc'; sortActionBtn.innerHTML = '按时间正序 <i class="fa-solid fa-arrow-up"></i>'; }
    else if (currentSortMode === 'timeAsc') { currentSortMode = 'titleAsc'; sortActionBtn.innerHTML = '按标题名称 <i class="fa-solid fa-arrow-down-a-z"></i>'; }
    else { currentSortMode = 'timeDesc'; sortActionBtn.innerHTML = '按编辑时间 <i class="fa-solid fa-caret-down"></i>'; }
    renderNoteList();
  });
}

// 撤销
if (undoBtn) undoBtn.addEventListener('click', () => { if (easyMDE && easyMDE.codemirror) { easyMDE.codemirror.undo(); easyMDE.codemirror.focus(); } });

// ===========================================
// 🚀 初始化应用
// ===========================================
renderFolderList();
renderNoteList();
initTheme();