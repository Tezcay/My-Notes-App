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

// 2.5 文件夹展开/收起
if (folderHeader) {
  folderHeader.addEventListener("click", (e) => {
    // 如果点击的是添加按钮，不要收起
    if (e.target.closest(".add-btn")) return;

    // 切换折叠状态
    folderHeader.classList.toggle("collapsed");
    folderListEl.classList.toggle("collapsed");
  });
}

// 3. 新增笔记
if (addNoteBtn) {
  addNoteBtn.addEventListener("click", () => {
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
      title: "新建待办", // 稍微改个默认标题，区分一下
      content: "",
      updateTime: Date.now(),
      categoryId: targetCategoryId,
    };

    notes.unshift(newNote);
    saveAllToLocalStorage();

    // 如果之前因为切换分类清空了 currentNoteId，现在要选中新的
    currentNoteId = newId;

    // 强制刷新视图
    // 注意：如果你之前在“已完成”里新建，现在要自动跳到“未完成”视图才能看到它
    if (currentCategoryId === "todo-finished") {
      switchCategory("todo-unfinished", "未完成");
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
    if (categoryId === "private") {
      alert("✅ 笔记已加密归档");
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
  if (categoryId === "private") {
    const savedPassword = localStorage.getItem("private_password");

    if (!savedPassword) {
      // 情况a：还没设置过密码 -> 引导设置
      showModal(
        "启用私密空间",
        "首次使用请设置访问密码(4-10位)",
        (inputVal) => {
          if (!inputVal) return;
          if (inputVal.length < 4 || inputVal.length > 10) {
            alert("密码长度必须在 4 到 10 之间");
            return;
          }
          localStorage.setItem("private_password", inputVal);
          alert("密码设置成功!请牢记");
          performMove(); // 设置成功，执行移动
        }
      );
    } else {
      // 情况b：已有密码 -> 验证身份
      showModal("身份验证", "移入私密空间需验证密码", (inputVal) => {
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
noteListEl.addEventListener("change", (e) => {
  // 检查点击的是不是复选框
  if (e.target.classList.contains("todo-checkbox")) {
    const noteId = e.target.dataset.id; // 获取笔记ID
    const isChecked = e.target.checked; // 是打钩(true)还是取消(false)

    // 1. 在数组里找到这条笔记
    const note = notes.find((n) => n.id == noteId);
    if (!note) return;

    // 2. 核心逻辑：切换分类
    if (isChecked) {
      // 变成已完成
      note.categoryId = "todo-finished";
      // 稍微延迟一下刷新，让用户看到打钩的动画
      setTimeout(() => {
        renderNoteList();
      }, 200);
    } else {
      // 变成未完成
      note.categoryId = "todo-unfinished";
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

document.addEventListener("keydown", (e) => {
  // 1. Ctrl + S (保存)
  // e.metaKey 是为了兼容 Mac 的 Command 键
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault(); // 阻止浏览器弹出“保存网页”的默认窗口

    // 执行保存
    if (currentNoteId) {
      const note = notes.find((n) => n.id == currentNoteId);
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
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    // 触发新建按钮的点击事件
    if (addNoteBtn) addNoteBtn.click();
  }

  // 3. Esc (关闭弹窗 / 清除搜索 / 退出编辑)
  if (e.key === "Escape") {
    // 优先级 1: 如果有弹窗，先关弹窗
    const modal = document.getElementById("custom-modal");
    const ctxMenu = document.getElementById("folder-context-menu");

    if (modal && modal.style.display === "flex") {
      hideModal();
      return;
    }

    if (ctxMenu && ctxMenu.style.display === "block") {
      ctxMenu.style.display = "none";
      return;
    }

    // 优先级 2: 如果正在搜索，清除搜索
    if (document.activeElement === searchInput) {
      searchInput.value = "";
      searchInput.blur();
      currentSearchKeyword = "";
      renderNoteList();
      return;
    }

    // 优先级 3: 退出全屏或聚焦到列表（可选）
    // 目前没有全屏功能，暂时不做处理
  }
});

// ===========================================
// 📱 移动端逻辑 (Mobile Logic)
// ===========================================

// 1. 汉堡菜单 -> 打开侧边栏
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.add("open");
  });
}

// 2. 点击侧边栏遮罩 -> 关闭侧边栏
// (简单的做法：点击侧边栏任意链接后自动关闭)
sidebar.addEventListener("click", (e) => {
  if (window.innerWidth <= 768 && e.target.closest(".nav-item")) {
    sidebar.classList.remove("open");
  }
});

// 点击侧边栏外部关闭 (高级体验)
document.addEventListener("click", (e) => {
  if (
    window.innerWidth <= 768 &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    e.target !== mobileMenuBtn
  ) {
    sidebar.classList.remove("open");
  }
});

// 3. 返回按钮 (从编辑器 -> 列表)
if (mobileBackBtn) {
  mobileBackBtn.addEventListener("click", () => {
    // 移除编辑模式类名，让编辑器滑走
    appContainer.classList.remove("mobile-editing");

    // 关键：手机上返回列表时，要把键盘收起，并重置选中状态
    if (document.activeElement) document.activeElement.blur();

    // 可选：稍微延迟一下清除当前ID，以免滑出动画时内容突然变空
    setTimeout(() => {
      // currentNoteId = null; // 如果你想保留选中状态，这行可以注释掉
    }, 300);
  });
}

// ===========================================
// 📱 移动端/快捷操作适配 (工具栏按钮)
// ===========================================

// 1. 加密/解密按钮 (Lock Button)
const lockBtn = document.getElementById("lock-btn");
if (lockBtn) {
  lockBtn.addEventListener("click", () => {
    if (!currentNoteId) {
      alert("请先选择一条笔记");
      return;
    }

    const note = notes.find((n) => n.id == currentNoteId);
    if (!note) return;

    // 判断当前状态
    if (note.categoryId === "private") {
      // A. 如果已经在私密里 -> 移出来 (移到未分类)
      showConfirm("解除私密", "确定要将此笔记移出私密空间吗？", () => {
        handleMoveNoteToCategory(currentNoteId, "uncategorized");
        alert("🔓 笔记已解除私密，移至“未分类”");
        // 刷新图标状态
        updateToolbarIcons(note);
      });
    } else {
      // B. 如果是普通笔记 -> 移进去 (复用之前的逻辑)
      // 注意：handleMoveNoteToCategory 里面已经包含了密码验证逻辑
      handleMoveNoteToCategory(currentNoteId, "private");
      // 移动成功后图标会在渲染时自动更新
    }
  });
}

// 2. 移动文件夹按钮 (Move Button)
const moveBtn = document.getElementById("move-btn");
if (moveBtn) {
  moveBtn.addEventListener("click", () => {
    if (!currentNoteId) {
      alert("请先选择一条笔记");
      return;
    }

    // 生成一个选项列表供用户选择
    // 这里我们简单用 prompt 或者 confirm，为了体验更好，建议用自定义 Modal
    // 但为了代码简洁，我们这里复用 showModal 改造成“下拉选择”比较麻烦
    // 我们用一个简单的原生技巧：构建一个临时的选择文本

    let promptText = "请输入目标文件夹的名称或序号：\n";
    // 过滤掉特殊分类，只显示用户文件夹
    const validCategories = categories.filter(
      (c) => !["private", "trash"].includes(c.id)
    );

    validCategories.forEach((c, index) => {
      promptText += `[${index + 1}] ${c.name}\n`;
    });
    promptText += `[0] 未分类`;

    // 弹窗询问 (简化版交互)
    const input = prompt(promptText);
    if (input === null) return; // 取消

    let targetCategory = null;
    const index = parseInt(input);

    if (!isNaN(index)) {
      if (index === 0) targetCategory = { id: "uncategorized", name: "未分类" };
      else if (index > 0 && index <= validCategories.length) {
        targetCategory = validCategories[index - 1];
      }
    } else {
      // 尝试按名字匹配
      targetCategory = validCategories.find((c) => c.name === input);
    }

    if (targetCategory) {
      handleMoveNoteToCategory(currentNoteId, targetCategory.id);
      alert(`📂 已移动到 "${targetCategory.name}"`);
    } else {
      alert("❌ 未找到该文件夹");
    }
  });
}

// 3. 辅助函数：根据当前笔记状态更新图标 (可选)
function updateToolbarIcons(note) {
  if (!note) return;
  const icon = lockBtn.querySelector("i");
  if (note.categoryId === "private") {
    icon.className = "fa-solid fa-lock-open"; // 显示“解锁”图标
    lockBtn.title = "解除私密状态";
    lockBtn.classList.add("active"); // 可以加个高亮样式
  } else {
    icon.className = "fa-solid fa-lock"; // 显示“上锁”图标
    lockBtn.title = "移入私密空间";
    lockBtn.classList.remove("active");
  }
}

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
