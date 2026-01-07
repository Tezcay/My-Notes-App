// ============================================================================
// 【模块F】高级功能 🚀 (Advanced)
// ============================================================================

// 1. 私密笔记
function handlePrivateAccess(targetId, targetName) {
  const savedPassword = localStorage.getItem('private_password');
  if (!savedPassword) {
    showModal('设置私密密码', '请设置4-10位访问密码', (inputVal) => {
      if (!inputVal) { alert("密码不能为空!"); return; }
      if (inputVal.length < 4 || inputVal.length > 10) {
        alert("密码长度必须在 4 到 10 之间");
        setTimeout(() => handlePrivateAccess(targetId, targetName), 100);
        return;
      }
      localStorage.setItem('private_password', inputVal);
      alert('密码设置成功');
      switchCategory(targetId, targetName);
    });
  } else {
    showModal('私密笔记已锁定', '请输入密码解锁', (inputVal) => {
      if (inputVal === savedPassword) switchCategory(targetId, targetName);
      else alert('密码错误');
    });
  }
}

// 2. 右键菜单
const ctxMenu = document.getElementById('folder-context-menu');
const ctxRenameBtn = document.getElementById('ctx-rename');
const ctxDeleteBtn = document.getElementById('ctx-delete');
let ctxTargetId = null;

function showContextMenu(e, categoryId) {
  ctxTargetId = categoryId;
  ctxMenu.style.left = `${e.pageX}px`;
  ctxMenu.style.top = `${e.pageY}px`;
  ctxMenu.style.display = 'block';
}

document.addEventListener('click', () => { if (ctxMenu) ctxMenu.style.display = 'none'; });

if (ctxRenameBtn) {
  ctxRenameBtn.addEventListener('click', () => {
    if (!ctxTargetId) return;
    const category = categories.find(c => c.id === ctxTargetId);
    if (!category) return;
    showModal('重命名文件夹', '请输入新名称', (newName) => {
      if (newName === category.name) return;
      category.name = newName;
      saveAllToLocalStorage();
      renderFolderList();
      if (currentCategoryId === ctxTargetId) listTitleEl.textContent = newName;
    });
    setTimeout(() => { if (modalInput) { modalInput.value = category.name; modalInput.select(); } }, 50);
  });
}

if (ctxDeleteBtn) {
  ctxDeleteBtn.addEventListener('click', () => {
    if (!ctxTargetId) return;
    const category = categories.find(c => c.id === ctxTargetId);
    if (category) handleDeleteFolder(category);
  });
}

// 3. 重置编辑器
function resetEditor() {
  const container = document.querySelector('.editor-container');
  const previewArea = document.getElementById('note-preview-area');
  if (container) container.classList.remove('preview-mode');
  if (previewArea) previewArea.innerHTML = '';

  editorTitle.value = '';
  if (typeof editorContent !== 'undefined' && editorContent) editorContent.value = '';
  editorTitle.disabled = false;

  if (typeof easyMDE !== 'undefined' && easyMDE) {
    easyMDE.value("");
    setTimeout(() => { if (easyMDE.codemirror) easyMDE.codemirror.refresh(); }, 10);
  }

  const previewBtn = document.querySelector('.editor-toolbar .fa-pen');
  if (previewBtn) { previewBtn.classList.remove('fa-pen'); previewBtn.classList.add('fa-eye'); previewBtn.title = "预览"; }
  currentNoteId = null;
}

// 4. 标题回车跳正文
if (noteTitleInput) {
  noteTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (typeof easyMDE !== 'undefined' && easyMDE && easyMDE.codemirror) {
        easyMDE.codemirror.focus();
        easyMDE.codemirror.setCursor(0, 0);
      }
    }
  });
}

// 5. 主题切换
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); updateThemeIcon(true); }
  else { document.documentElement.removeAttribute('data-theme'); updateThemeIcon(false); }
}

function updateThemeIcon(isDark) {
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('i');
    if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); updateThemeIcon(false); }
    else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); updateThemeIcon(true); }
  });
}

// 移动端逻辑
if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
sidebar.addEventListener('click', (e) => { if (window.innerWidth <= 768 && e.target.closest('.nav-item')) sidebar.classList.remove('open'); });
if (mobileBackBtn) mobileBackBtn.addEventListener('click', () => { appContainer.classList.remove('mobile-editing'); currentNoteId = null; const activeItem = document.querySelector('.note-item.active'); if (activeItem) activeItem.classList.remove('active'); });