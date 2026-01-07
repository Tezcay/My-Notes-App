// ============================================================================
// 【模块F】高级功能 🚀 (Advanced)
// ============================================================================

// 1. 私密笔记
function handlePrivateAccess(targetId, targetName) {
  const savedPassword = localStorage.getItem("private_password");
  if (!savedPassword) {
    showModal("设置私密密码", "请设置4-10位访问密码", (inputVal) => {
      if (!inputVal) {
        alert("密码不能为空!");
        return;
      }
      if (inputVal.length < 4 || inputVal.length > 10) {
        alert("密码长度必须在 4 到 10 之间");
        setTimeout(() => handlePrivateAccess(targetId, targetName), 100);
        return;
      }
      localStorage.setItem("private_password", inputVal);
      alert("密码设置成功");
      switchCategory(targetId, targetName);
    });
  } else {
    showModal("私密笔记已锁定", "请输入密码解锁", (inputVal) => {
      if (inputVal === savedPassword) switchCategory(targetId, targetName);
      else alert("密码错误");
    });
  }
}

// 2. 右键菜单
const ctxMenu = document.getElementById("folder-context-menu");
const ctxRenameBtn = document.getElementById("ctx-rename");
const ctxDeleteBtn = document.getElementById("ctx-delete");
let ctxTargetId = null;

function showContextMenu(e, categoryId) {
  ctxTargetId = categoryId;
  ctxMenu.style.left = `${e.pageX}px`;
  ctxMenu.style.top = `${e.pageY}px`;
  ctxMenu.style.display = "block";
}

document.addEventListener("click", () => {
  if (ctxMenu) ctxMenu.style.display = "none";
});

if (ctxRenameBtn) {
  ctxRenameBtn.addEventListener("click", () => {
    if (!ctxTargetId) return;
    const category = categories.find((c) => c.id === ctxTargetId);
    if (!category) return;
    showModal("重命名文件夹", "请输入新名称", (newName) => {
      if (newName === category.name) return;
      category.name = newName;
      saveAllToLocalStorage();
      renderFolderList();
      if (currentCategoryId === ctxTargetId) listTitleEl.textContent = newName;
    });
    setTimeout(() => {
      if (modalInput) {
        modalInput.value = category.name;
        modalInput.select();
      }
    }, 50);
  });
}

if (ctxDeleteBtn) {
  ctxDeleteBtn.addEventListener("click", () => {
    if (!ctxTargetId) return;
    const category = categories.find((c) => c.id === ctxTargetId);
    if (category) handleDeleteFolder(category);
  });
}

// 3. 重置编辑器
function resetEditor() {
  const container = document.querySelector(".editor-container");
  const previewArea = document.getElementById("note-preview-area");
  if (container) container.classList.remove("preview-mode");
  if (previewArea) previewArea.innerHTML = "";

  editorTitle.value = "";
  if (typeof editorContent !== "undefined" && editorContent)
    editorContent.value = "";
  editorTitle.disabled = false;

  if (typeof easyMDE !== "undefined" && easyMDE) {
    easyMDE.value("");
    setTimeout(() => {
      if (easyMDE.codemirror) easyMDE.codemirror.refresh();
    }, 10);
  }

  const previewBtn = document.querySelector(".editor-toolbar .fa-pen");
  if (previewBtn) {
    previewBtn.classList.remove("fa-pen");
    previewBtn.classList.add("fa-eye");
    previewBtn.title = "预览";
  }
  currentNoteId = null;
}

// 4. 标题回车跳正文
if (editorTitle) {
  editorTitle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      if (typeof easyMDE !== "undefined" && easyMDE && easyMDE.codemirror) {
        easyMDE.codemirror.focus();
        easyMDE.codemirror.setCursor(0, 0);
      }
    }
  });
}

// 5. 主题切换
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    updateThemeIcon(true);
  } else {
    document.documentElement.removeAttribute("data-theme");
    updateThemeIcon(false);
  }
}

function updateThemeIcon(isDark) {
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector("i");
    if (icon) icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
      updateThemeIcon(false);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      updateThemeIcon(true);
    }
  });
}

// 6. 移动端逻辑
if (mobileMenuBtn)
  mobileMenuBtn.addEventListener("click", () =>
    sidebar.classList.toggle("open")
  );
sidebar.addEventListener("click", (e) => {
  if (window.innerWidth <= 768 && e.target.closest(".nav-item"))
    sidebar.classList.remove("open");
});
if (mobileBackBtn)
  mobileBackBtn.addEventListener("click", () => {
    appContainer.classList.remove("mobile-editing");
    currentNoteId = null;
    const activeItem = document.querySelector(".note-item.active");
    if (activeItem) activeItem.classList.remove("active");
  });

// 7. 数据备份与恢复（导入/导出）
// a. 导出(Export)
const exportBtn = document.getElementById("export-btn");

if (exportBtn) {
  // 异步操作：文件保存可以另存为
  exportBtn.addEventListener("click", async (e) => {  // e 防止事件冒泡
    // 防止点击按钮时触发侧边栏的“切换分类”逻辑，避免界面闪烁
    e.stopPropagation();

    // 准备要导出的数据对象
    const data = {
      notes: notes, // 来自 1_data.js 的全局变量
      categories: categories,
      version: "1.0", // 版本号，方便以后做兼容
      exportTime: new Date().toLocaleString(),
    };

    try {
      // 准备数据字符串和文件名
      const dataStr = JSON.stringify(data, null, 2); // null, 2 让文件带缩进
      // 生成文件名（两种方式都需要用）
      const fileName = `My_Notes_Backup_${Date.now()}.json`;

      // 尝试使用“另存为”窗口(Modern API)
      if (window.showSaveFilePicker) {
        // 现代浏览器逻辑
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName, // 传入文件名字符串, 不是blob对象
          types: [
            // 复数
            {
              description: "JSON备份文件",
              accept: { "application/json": [".json"] },
            },
          ],
        });

        // 用户选好路径后创建一个可写流
        const writable = await handle.createWritable();
        // 写入数据并关闭流
        await writable.write(dataStr);
        await writable.close();

        // 用 alert 体验更好
        alert("✅ 导出成功！已保存至指定位置。");
      } else {
        // 兼容旧版浏览器逻辑
        // 如果不支持，执行原来的下载逻辑
        throw new error("UseFallback"); // 抛出错误跳到 catch 里执行降级方案
      }
    } catch (err) {
      // 异常处理
      // 如果用户点击取消，触发 AbortError, 不需要处理
      if (err.name === "AbortError") return;

      // 如果是不支持 API 或其他错误，执行传统的下载方法
      console.log("正在使用兼容模式下载...");
      fallbackDownload(data);
    }
  });
}

// 传统的 Blob 下载方式（兼容模式）
function fallbackDownload(data) {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  // 使用统一的文件名
  a.download = `My_Notes_Backup_${Date.now()}.json`;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // alert 体验更好
  alert("✅ 导出成功！(已下载到默认文件夹)");
}

// b. 导入(Import)
const importBtn = document.getElementById("import-btn");
const importInput = document.getElementById("import-input");

if (importBtn && importInput) {
  // 点击图标->触发隐藏的 input 文件选择框
  importBtn.addEventListener("click", (e) => {
    // 阻止冒泡
    e.stopPropagation();

    // 技巧：每次点击前清空 value，确保用户选了同一个文件也出发 change 事件
    importInput.value = "";
    importInput.click();
  });

  // 监听文件选择变化
  importInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 防御性确定：导入会覆盖现有数据
    showConfirm(
      "恢复数据警告",
      "⚠️ 警告：恢复数据将【覆盖】当前所有笔记！\n建议先点击左侧下载按钮备份当前数据。\n\n确定要继续吗？'",
      () => {
        // 只有用户点击确定后，才执行这里的代码
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);

            // 数据校验
            if (Array.isArray(data.notes) && Array.isArray(data.categories)) {
              // 更新全局数据
              notes = data.notes;
              categories = data.categories;

              // 保存到硬盘并立刻刷新界面
              saveAllToLocalStorage();
              renderFolderList();
              renderNoteList();

              // 清空编辑器状态
              if (typeof resetEditor === "function") resetEditor();

              // 成功提示: alert
              alert("🎉 数据已成功恢复！");
            } else {
              alert("❌ 文件格式错误：找不到笔记数据");
            }
          } catch (err) {
            console.error(err);
            alert("❌ 读取失败：文件可能已损坏或格式不正确");
          }
        };
        // 开始读取文件
        reader.readAsText(file);
      }
    );
  });
}
