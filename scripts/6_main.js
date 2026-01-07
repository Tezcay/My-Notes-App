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

// 1. 侧边栏点击
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

// 2. 新增文件夹
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

// 3. 新增笔记
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

// 4. 标题实时保存
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

// 5. 删除笔记
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

// 6. 删除文件夹逻辑
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

// 7. 拖拽逻辑 (笔记移动)
function handleMoveNoteToCategory(noteId, categoryId) {
  const note = notes.find((n) => n.id == noteId);
  if (!note || note.categoryId === categoryId) return;

  // 封装移动操作，只有验证通过才执行
  const performMove = () => {
    note.categoryId = categoryId;
    note.updateTime = Date.now();
    saveAllToLocalStorage();
    renderNoteList();

    // 如果是从其他分类移入私密笔记，最好刷新一下列表让它“消失”
    // (因为当前还停留在普通列表视图)
    if (categoryId === 'private') {
        alert('✅ 笔记已加密归档');
    }
  };

  // 安全检查1. 如果是移入回收站
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

  // 安全检查2. 如果是移入私密笔记
  if (categoryId === 'private') {
    const savedPassword = localStorage.getItem('private_password');

    if (!savedPassword) {
      // 情况a：还没设置过密码 -> 引导设置
      showModal('启用私密空间', '首次使用请设置访问密码(4-10位)', (inputVal) => {
        if (!inputVal) return;
        if (inputVal.length < 4 || inputVal.length > 10) {
          alert("密码长度必须在 4 到 10 之间");
          return;
        }
        localStorage.setItem('private_password', inputVal);
        alert("密码设置成功!请牢记");
        performMove(); // 设置成功，执行移动
      });
    } else {
      // 情况b：已有密码 -> 验证身份
      showModal('身份验证', '移入私密空间需验证密码', (inputVal) => {
        if (inputVal === savedPassword) {
          performMove();
        } else {
          alert("密码错误");
        }
      });
    }
    return; // 拦截，等待弹窗回调
  }

  // 普通移动
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


// ===========================================
// ⌨️ 全局快捷键支持 (Shortcuts)
// ===========================================

document.addEventListener('keydown', (e) => {
  // 1. Ctrl + S (保存)
  // e.metaKey 是为了兼容 Mac 的 Command 键
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault(); // 阻止浏览器弹出“保存网页”的默认窗口
    
    // 执行保存
    if (currentNoteId) {
      const note = notes.find(n => n.id == currentNoteId);
      if (note) {
        note.updateTime = Date.now();
        // 重新渲染列表以更新时间显示
        renderNoteList(); 
      }
    }
    saveAllToLocalStorage();

    // ✨ 给一点视觉反馈 (在底部的统计栏闪烁一下“已保存”)
    const originalText = noteCountEl.textContent;
    noteCountEl.textContent = "✅ 已保存";
    noteCountEl.style.color = "var(--accent-green)";
    
    setTimeout(() => {
      noteCountEl.textContent = originalText;
      noteCountEl.style.color = "";
    }, 1000);
  }

  // 2. Ctrl + N (新建笔记)
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    // 触发新建按钮的点击事件
    if (addNoteBtn) addNoteBtn.click();
  }

  // 3. Esc (关闭弹窗 / 清除搜索 / 退出编辑)
  if (e.key === 'Escape') {
    // 优先级 1: 如果有弹窗，先关弹窗
    const modal = document.getElementById('custom-modal');
    const ctxMenu = document.getElementById('folder-context-menu');
    
    if (modal && modal.style.display === 'flex') {
      hideModal();
      return;
    }
    
    if (ctxMenu && ctxMenu.style.display === 'block') {
      ctxMenu.style.display = 'none';
      return;
    }

    // 优先级 2: 如果正在搜索，清除搜索
    if (document.activeElement === searchInput) {
      searchInput.value = '';
      searchInput.blur();
      currentSearchKeyword = '';
      renderNoteList();
      return;
    }
    
    // 优先级 3: 退出全屏或聚焦到列表（可选）
    // 目前没有全屏功能，暂时不做处理
  }
});



// 一直都放最后
// ===========================================
// 🚀 初始化应用
// ===========================================
renderFolderList();
renderNoteList();
initTheme();

// 初始化编辑器状态
// 如果当前没有选中笔记，就直接显示“空白欢迎页”
if (!currentNoteId) {
  resetEditor();
}