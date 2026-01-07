// ============================================================================
// 【模块D】事件入口 ⚡ (Main)
// ============================================================================

function switchCategory(id, name) {
  currentCategoryId = id;
  currentNoteId = null;
  listTitleEl.textContent = name;
  renderFolderList();
  renderNoteList();
  editorTitle.value = "";
  if (typeof easyMDE !== "undefined" && easyMDE) easyMDE.value("");
  if (window.innerWidth <= 768) sidebar.classList.remove("open");
}

// 侧边栏点击
sidebar.addEventListener("click", (e) => {
  const navItem = e.target.closest(".nav-item");
  if (navItem) {
    const targetId = navItem.dataset.id;
    const targetName = navItem.querySelector(".text").textContent;
    if (targetId === "private") {
      handlePrivateAccess(targetId, targetName);
      return;
    }
    switchCategory(targetId, targetName);
  }
});

// 新增文件夹
if (addFolderBtn) {
  addFolderBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showModal("新建文件夹", "请输入文件夹名称", (folderName) => {
      const newCategory = { id: "folder-" + Date.now(), name: folderName };
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

    // 🧠 智能判断新建笔记的归属
    if (currentCategoryId === "all") {
      // 如果在“全部”里新建，默认归入“未分类”
      targetCategoryId = "uncategorized";
    } else if (currentCategoryId === "todo-finished") {
      // 如果在“已完成”里新建，自动归入“未完成”（毕竟刚创建的一般都没做完）
      targetCategoryId = "todo-unfinished";
    }
    // 如果是 "todo-unfinished"，就保持原样，不用变

    const newNote = { 
      id: newId, 
      title: '新建待办', // 稍微改个默认标题，区分一下
      content: '', 
      updateTime: Date.now(), 
      categoryId: targetCategoryId 
    };
    
    notes.unshift(newNote);
    saveAllToLocalStorage();
    
    // 如果之前因为切换分类清空了 currentNoteId，现在要选中新的
    currentNoteId = newId;
    
    // 强制刷新视图
    // 注意：如果你之前在“已完成”里新建，现在要自动跳到“未完成”视图才能看到它
    if (currentCategoryId === "todo-finished") {
       switchCategory('todo-unfinished', '未完成');
    } else {
       renderNoteList();
    }
    
    loadNoteToEditor(newNote);
    
    // 聚焦标题栏，方便直接打字
    if (editorTitle) editorTitle.focus();
  });
}

// 标题实时保存
if (editorTitle) {
  editorTitle.addEventListener("input", (e) => {
    if (currentNoteId) {
      const note = notes.find((n) => n.id == currentNoteId);
      if (note) {
        note.title = e.target.value;
        note.updateTime = Date.now();
        saveAllToLocalStorage();
        const activeTitle = document.querySelector(
          `.note-item[data-id="${currentNoteId}"] .note-title`
        );
        if (activeTitle) activeTitle.textContent = note.title || "无标题";
      }
    }
  });
}

// 删除笔记
if (deleteBtn) {
  deleteBtn.addEventListener("click", () => {
    if (!currentNoteId) {
      alert("请先选择一条要删除的笔记");
      return;
    }
    const currentNote = notes.find((n) => n.id == currentNoteId);
    if (!currentNote) return;

    if (currentCategoryId === "trash") {
      showConfirm("永久删除", "确定要永久销毁这条笔记吗？", () => {
        notes = notes.filter((n) => n.id != currentNoteId);
        saveAllToLocalStorage();
        resetEditor();
        renderNoteList();
      });
      return;
    }
    showConfirm("移入回收站", "确定要将这条笔记丢进回收站吗？", () => {
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
  showConfirm(
    "删除文件夹",
    `确定要删除文件夹 "${category.name}" 及其所有笔记吗？`,
    () => {
      notes.forEach((note) => {
        if (note.categoryId === category.id) note.categoryId = "uncategorized";
      });
      categories = categories.filter((c) => c.id !== category.id);
      if (currentCategoryId === category.id) {
        currentCategoryId = "all";
        listTitleEl.textContent = "全部笔记";
      }
      saveAllToLocalStorage();
      renderFolderList();
      renderNoteList();
    }
  );
}

// 拖拽逻辑 (笔记移动)
function handleMoveNoteToCategory(noteId, categoryId) {
  const note = notes.find((n) => n.id == noteId);
  if (!note || note.categoryId === categoryId) return;

  const performMove = () => {
    note.categoryId = categoryId;
    note.updateTime = Date.now();
    saveAllToLocalStorage();
    renderNoteList();
  };

  if (categoryId === "trash") {
    showConfirm(
      "移入回收站",
      `确定要将笔记 "${note.title}" 丢进回收站吗?`,
      () => {
        performMove();
      }
    );
    return;
  }
  performMove();
}

// 静态导航拖拽目标
const staticNavItems = document.querySelectorAll(".nav-item[data-id]");
staticNavItems.forEach((navItem) => {
  const categoryId = navItem.dataset.id;
  if (["all", "todo-unfinished", "todo-finished"].includes(categoryId)) return;
  navItem.addEventListener("dragover", (e) => {
    e.preventDefault();
    navItem.classList.add("drag-over");
  });
  navItem.addEventListener("dragleave", () => {
    navItem.classList.remove("drag-over");
  });
  navItem.addEventListener("drop", (e) => {
    e.preventDefault();
    navItem.classList.remove("drag-over");
    const noteId = e.dataTransfer.getData("text/plain");
    handleMoveNoteToCategory(noteId, categoryId);
  });
});

// 搜索
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearchKeyword = e.target.value.trim();
    renderNoteList();
  });
}

// 排序
if (sortActionBtn) {
  sortActionBtn.addEventListener("click", () => {
    if (currentSortMode === "timeDesc") {
      currentSortMode = "timeAsc";
      sortActionBtn.innerHTML =
        '按时间正序 <i class="fa-solid fa-arrow-up"></i>';
    } else if (currentSortMode === "timeAsc") {
      currentSortMode = "titleAsc";
      sortActionBtn.innerHTML =
        '按标题名称 <i class="fa-solid fa-arrow-down-a-z"></i>';
    } else {
      currentSortMode = "timeDesc";
      sortActionBtn.innerHTML =
        '按编辑时间 <i class="fa-solid fa-caret-down"></i>';
    }
    renderNoteList();
  });
}

// 撤销
if (undoBtn)
  undoBtn.addEventListener("click", () => {
    if (easyMDE && easyMDE.codemirror) {
      easyMDE.codemirror.undo();
      easyMDE.codemirror.focus();
    }
  });

// ===========================================
// 🚀 初始化应用
// ===========================================
renderFolderList();
renderNoteList();
initTheme();


// ===========================================
// ✅ 待办事项逻辑 (Todo Logic)
// ===========================================

// 使用“事件委托”监听复选框点击
// (因为复选框是动态生成的，直接监听父元素 noteListEl 最稳妥)
noteListEl.addEventListener('change', (e) => {
  // 检查点击的是不是复选框
  if (e.target.classList.contains('todo-checkbox')) {
    const noteId = e.target.dataset.id; // 获取笔记ID
    const isChecked = e.target.checked; // 是打钩(true)还是取消(false)
    
    // 1. 在数组里找到这条笔记
    const note = notes.find(n => n.id == noteId);
    if (!note) return;

    // 2. 核心逻辑：切换分类
    if (isChecked) {
      // 变成已完成
      note.categoryId = 'todo-finished';
      // 稍微延迟一下刷新，让用户看到打钩的动画
      setTimeout(() => {
        renderNoteList(); 
      }, 200);
    } else {
      // 变成未完成
      note.categoryId = 'todo-unfinished';
      setTimeout(() => {
        renderNoteList();
      }, 200);
    }

    // 3. 更新时间并保存
    note.updateTime = Date.now();
    saveAllToLocalStorage();
  }
});