// ============================================================================
// 【模块C】UI渲染 🎨 (Rendering)
// ============================================================================

/**
 * 渲染左侧文件夹列表
 */
/**
 * 渲染左侧文件夹列表 (支持双重拖拽：笔记归档 + 文件夹排序)
 */
function renderFolderList() {
  folderListEl.innerHTML = '';

  // 容错处理
  if (!categories) categories = [];

  categories.forEach((category, index) => {
    const li = document.createElement('li');
    li.className = 'nav-item sub-item';
    li.dataset.id = category.id;
    li.dataset.index = index; // 记录索引，方便排序

    // 1. 设置为可拖拽
    li.draggable = true;

    // 选中状态
    if (currentCategoryId === category.id) li.classList.add('active');

    // 内容渲染
    li.innerHTML = `<span class="icon"><i class="fa-regular fa-folder"></i></span><span class="text">${category.name}</span>`;

    // 2. 绑定右键菜单
    li.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // 必须恢复 pointer-events 才能点击，或者直接在这里处理
      showContextMenu(e, category.id);
    });

    // ========================================================
    // 🖱️ 核心拖拽逻辑 (Drag & Drop)
    // ========================================================

    // A. 开始拖拽 (Drag Start)
    li.addEventListener('dragstart', (e) => {
      // 标记当前正在拖拽的是“文件夹”
      e.dataTransfer.setData('application/x-type', 'folder');
      e.dataTransfer.setData('folder-index', index); // 传索引比传ID方便排序
      
      // 视觉效果
      li.classList.add('dragging');
      e.stopPropagation(); // 防止冒泡
    });

    // B. 拖拽结束 (Drag End)
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      // 清理所有的高亮样式
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('drag-over'));
    });

    // C. 拖拽经过 (Drag Over)
    li.addEventListener('dragover', (e) => {
      e.preventDefault(); // 必须阻止默认行为才能触发 drop
      
      // 获取当前拖拽的类型
      // 注意：dragover 中不能直接读取 getData 的值，但可以读取 types
      // 这里简单处理：只要是拖拽，就高亮
      li.classList.add('drag-over');
    });

    // D. 拖拽离开 (Drag Leave)
    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });

    // E. 放下 (Drop) - 核心判断逻辑！
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');

      // --- 判断 1：是“文件夹排序”吗？ ---
      const dragType = e.dataTransfer.getData('application/x-type');
      if (dragType === 'folder') {
        const fromIndex = parseInt(e.dataTransfer.getData('folder-index'));
        const toIndex = index; // 当前这个 li 的索引

        if (fromIndex !== toIndex && !isNaN(fromIndex)) {
          // 数组移动元素：先切掉，再插入
          const [movedItem] = categories.splice(fromIndex, 1); // 拿出
          categories.splice(toIndex, 0, movedItem); // 插进去
          
          // 保存并重新渲染
          saveAllToLocalStorage();
          renderFolderList();
          console.log(`📂 文件夹排序：从 ${fromIndex} 移到 ${toIndex}`);
        }
        return; // 结束，不执行下面的笔记逻辑
      }

      // --- 判断 2：是“移动笔记”吗？ ---
      // 这里的 'text/plain' 是我们在 renderNoteList 里设置的 noteId
      const noteId = e.dataTransfer.getData('text/plain');
      if (noteId) {
        handleMoveNoteToCategory(noteId, category.id);
        console.log(`📝 笔记移动：笔记 ${noteId} -> 文件夹 ${category.name}`);
      }
    });

    folderListEl.appendChild(li);
  });
  
  updateStaticNavHighlight();
}

function updateStaticNavHighlight() {
  const allNavItems = document.querySelectorAll(".nav-item");
  allNavItems.forEach((item) => {
    if (item.dataset.id && currentCategoryId === item.dataset.id) {
      item.classList.add("active");
    } else {
      if (
        item.classList.contains("active") &&
        item.dataset.id !== currentCategoryId
      ) {
        item.classList.remove("active");
      }
    }
  });
}

/**
 * 渲染笔记列表
 */
function renderNoteList() {
  const filteredNotes = notes.filter((note) => {
    const contentToSearch = (note.title + note.content).toLowerCase();
    const keyword = currentSearchKeyword.toLowerCase();
    if (!contentToSearch.includes(keyword)) return false;

    if (currentCategoryId === "trash") return note.categoryId === "trash";
    if (note.categoryId === "trash") return false;
    if (currentCategoryId === "all") return note.categoryId !== "private";
    return note.categoryId === currentCategoryId;
  });

  filteredNotes.sort((a, b) => {
    switch (currentSortMode) {
      case "timeDesc":
        return new Date(b.updateTime) - new Date(a.updateTime);
      case "timeAsc":
        return new Date(a.updateTime) - new Date(b.updateTime);
      case "titleAsc":
        return (a.title || "").localeCompare(b.title || "", "zh-CN");
      default:
        return 0;
    }
  });

  if (noteCountEl)
    noteCountEl.textContent = `共 ${filteredNotes.length} 条笔记`;
  noteListEl.innerHTML = "";

  if (filteredNotes.length === 0) {
    if (currentSearchKeyword) {
      noteListEl.innerHTML =
        '<div style="text-align:center; color:#999; padding:20px;">未搜索到相关笔记</div>';
    } else {
      const emptyIcon =
        currentCategoryId === "trash" ? "fa-trash-can" : "fa-box-open";
      const emptyText =
        currentCategoryId === "trash"
          ? "回收站里没有笔记"
          : "这里空空如也，快去记点什么吧";
      noteListEl.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ccc; padding-top: 60px;"><i class="fa-solid ${emptyIcon}" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i><div style="font-size: 14px;">${emptyText}</div></div>`;
    }
    return;
  }

  filteredNotes.forEach((note) => {
    const li = document.createElement("li");
    li.dataset.id = note.id;
    li.className = "note-item";

    li.draggable = true; 
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', note.id.toString()); // 传递笔记ID
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => { 
      li.classList.remove('dragging'); 
    });

    if (note.id === currentNoteId) li.classList.add("active");
    li.draggable = true;

    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", note.id.toString());
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

    const displayTitle = highlightText(
      note.title || "无标题",
      currentSearchKeyword
    );
    const plainContent = (note.content || "")
      .replace(/[#*`]/g, "")
      .replace(/\n/g, " ")
      .substring(0, 50);
    const displayContent = highlightText(
      plainContent || "无内容",
      currentSearchKeyword
    );

    // 新增：判断是否是待办事项
    const isTodo = currentCategoryId.startsWith('todo'); // 未完成
    const isFinished = currentCategoryId === 'todo-finished'; // 已完成

    // 准备复选框(检查是否是待办, 否显示空)
    const checkboxHtml = isTodo 
      ? `<div class="todo-check-wrapper" onclick="event.stopPropagation()">
      <input type="checkbox" class="todo-checkbox" data-id="${note.id}" ${isFinished ? 'checked' : ''}>
         </div>`
      : '';

    // 标题样式
    const titleStyle = isFinished ? 'text-decoration: line-through; color: #aaa;' : '';
    

    li.innerHTML = `
      ${checkboxHtml}
      <div class="note-content-wrapper" style="flex:1; overflow:hidden;">
        <div class="note-title" style="${titleStyle}">${displayTitle}</div>
        <div class="note-preview">${displayContent}</div>
        <div class="note-date">${formatTime(note.updateTime)}</div>
      </div>
    `;

    li.addEventListener("click", () => {
      currentNoteId = note.id;
      renderNoteList();
      loadNoteToEditor(note);
      if (appContainer) appContainer.classList.add("mobile-editing");
    });

    noteListEl.appendChild(li);
  });
}

function loadNoteToEditor(note) {
  isLoadingNote = true;
  currentNoteId = note.id;

  // a. 🧹 移除空白状态
  const emptyState = document.getElementById('editor-empty-state');
  if (emptyState) {
    emptyState.style.display = 'none'; // 隐藏空白页
  }

  // b. 🔓 显示并填充标题
  if (editorTitle) {
      editorTitle.classList.remove('editor-hidden'); // 显示标题栏
      editorTitle.disabled = false;
      editorTitle.value = note.title;
  }

  // c. 🔓 显示并填充编辑器
  if (typeof easyMDE !== 'undefined' && easyMDE) {
    // 显示 EasyMDE 容器
    const easyMDEWrapper = document.querySelector('.EasyMDEContainer');
    if (easyMDEWrapper) easyMDEWrapper.classList.remove('editor-hidden');

    easyMDE.value(note.content || "");
    
    // 关键：因为刚才 display:none 了，CodeMirror 需要刷新一下才能计算高度
    if (easyMDE.codemirror) {
        easyMDE.codemirror.setOption("readOnly", false);
        setTimeout(() => {
            easyMDE.codemirror.refresh(); 
        }, 10);
    }

    setTimeout(() => { isLoadingNote = false; }, 200);
  } else {
    // 兼容原生
    if (editorContent) {
        editorContent.classList.remove('editor-hidden');
        editorContent.disabled = false;
        editorContent.value = note.content || "";
    }
    isLoadingNote = false;
  }

  // d. 确保不在预览模式
  const container = document.querySelector('.editor-container');
  if (container) container.classList.remove('preview-mode');

  // 移动端点击不同的笔记时，工具栏上的“锁”应该自动变化
  if (typeof updateToolbarIcons === 'function') updateToolbarIcons(note);
}


// 弹窗逻辑
const modalOverlay = document.getElementById("custom-modal");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const modalInput = document.getElementById("modal-input");
const modalConfirmBtn = document.getElementById("modal-confirm");
const modalCancelBtn = document.getElementById("modal-cancel");
let onModalConfirm = null;
let isInputMode = true;

function showModal(title, placeholder, callback) {
  isInputMode = true;
  modalTitle.textContent = title;
  modalInput.style.display = "block";
  modalDesc.style.display = "none";
  modalInput.placeholder = placeholder;
  modalInput.value = "";
  if (title.includes("密码") || title.includes("锁定"))
    modalInput.type = "password";
  else modalInput.type = "text";
  modalOverlay.style.display = "flex";
  setTimeout(() => modalInput.focus(), 50);
  onModalConfirm = callback;
}

function showConfirm(title, message, callback) {
  isInputMode = false;
  modalTitle.textContent = title;
  modalInput.style.display = "none";
  modalDesc.style.display = "block";
  modalDesc.textContent = message;
  modalOverlay.style.display = "flex";
  onModalConfirm = callback;
}

function hideModal() {
  modalOverlay.style.display = "none";
  onModalConfirm = null;
}

if (modalCancelBtn) modalCancelBtn.onclick = hideModal;
if (modalConfirmBtn) {
  modalConfirmBtn.onclick = () => {
    if (isInputMode) {
      const value = modalInput.value.trim();
      if (value) {
        if (onModalConfirm) onModalConfirm(value);
        hideModal();
      } else alert("内容不能为空");
    } else {
      if (onModalConfirm) onModalConfirm();
      hideModal();
    }
  };
}
if (modalInput) {
  modalInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") modalConfirmBtn.click();
  });
}
