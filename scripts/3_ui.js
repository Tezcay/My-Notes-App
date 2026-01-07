// ============================================================================
// 【模块C】UI渲染 🎨 (Rendering)
// ============================================================================

/**
 * 渲染左侧文件夹列表
 */
function renderFolderList() {
  folderListEl.innerHTML = "";

  // 自动修复空数据
  if (!notes || notes.length === 0) {
    // 可选：notes = defaultNotes;
  }

  categories.forEach((category) => {
    const li = document.createElement("li");
    li.className = "nav-item sub-item";
    li.dataset.id = category.id;

    if (currentCategoryId === category.id) li.classList.add("active");

    li.innerHTML = `<span class="icon"><i class="fa-regular fa-folder"></i></span><span class="text">${category.name}</span>`;

    li.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e, category.id);
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      li.classList.add("drag-over");
    });
    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over");
    });
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-over");
      const noteId = e.dataTransfer.getData("text/plain");
      handleMoveNoteToCategory(noteId, category.id);
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
  editorTitle.value = note.title;

  if (typeof easyMDE !== "undefined" && easyMDE) {
    easyMDE.value(note.content || "");
    setTimeout(() => {
      isLoadingNote = false;
    }, 200);
  } else {
    editorContent.value = note.content || "";
    isLoadingNote = false;
  }

  const container = document.querySelector(".editor-container");
  if (container) container.classList.remove("preview-mode");
  editorTitle.disabled = false;
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
