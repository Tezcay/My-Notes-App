// ============================================================================
// 【模块E】编辑器集成 ✏️ (Editor)
// ============================================================================

let easyMDE = null;

if (editorContent) {
  easyMDE = new EasyMDE({
    element: editorContent,
    spellChecker: false,
    status: false,
    autofocus: false,
    hideIcons: ['fullscreen', 'side-by-side'],
    toolbar: [
      { name: "bold", action: EasyMDE.toggleBold, className: "fa fa-bold", title: "加粗" },
      { name: "italic", action: EasyMDE.toggleItalic, className: "fa fa-italic", title: "斜体" },
      "|",
      { name: "heading-1", action: EasyMDE.toggleHeading1, className: "fa fa-header fa-heading-1", title: "一级标题" },
      { name: "heading-2", action: EasyMDE.toggleHeading2, className: "fa fa-header fa-heading-2", title: "二级标题" },
      "|",
      { name: "unordered-list", action: EasyMDE.toggleUnorderedList, className: "fa fa-list-ul", title: "无序列表" },
      { name: "ordered-list", action: EasyMDE.toggleOrderedList, className: "fa fa-list-ol", title: "有序列表" },
      "|",
      { name: "code", action: EasyMDE.toggleCodeBlock, className: "fa fa-code", title: "代码块" },
      { name: "link", action: EasyMDE.drawLink, className: "fa fa-link", title: "插入链接" },
      {
        name: "upload-image",
        action: function uploadImage(editor) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              if (file.size > 500 * 1024) { alert('图片大小不能超过500KB'); return; }
              const reader = new FileReader();
              reader.onload = (event) => {
                const cm = editor.codemirror;
                const pos = cm.getCursor();
                cm.replaceRange(`![${file.name}](${event.target.result})`, pos);
                CodeMirror.signal(cm, "change", cm);
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        },
        className: "fa fa-image",
        title: "上传图片"
      },
      "|",
      {
        name: "preview",
        action: function customPreview(editor) {
          const container = document.querySelector('.editor-container');
          const previewArea = document.getElementById('note-preview-area');
          const isPreview = container.classList.contains('preview-mode');
          const previewBtn = document.querySelector('.editor-toolbar .fa-eye') || document.querySelector('.editor-toolbar .fa-pen');

          if (isPreview) {
            container.classList.remove('preview-mode');
            editorTitle.disabled = false;
            if (previewBtn) { previewBtn.classList.remove('fa-pen'); previewBtn.classList.add('fa-eye'); previewBtn.title = "预览"; }
          } else {
            container.classList.add('preview-mode');
            if (typeof marked !== 'undefined') previewArea.innerHTML = marked.parse(editor.value() || '# 无内容');
            editorTitle.disabled = true;
            if (previewBtn) { previewBtn.classList.remove('fa-eye'); previewBtn.classList.add('fa-pen'); previewBtn.title = "返回编辑"; }
          }
        },
        className: "fa fa-eye",
        title: "预览"
      },
      "|",
      {
        name: "toggle-sidebar",
        action: function toggleSidebar(editor) {
          const sidebar = document.querySelector('.sidebar');
          const listView = document.querySelector('.list-view');
          if (sidebar && listView) {
            sidebar.classList.toggle('collapsed');
            listView.classList.toggle('collapsed');
            setTimeout(() => { if (editor && editor.codemirror) editor.codemirror.refresh(); }, 300);
          }
        },
        className: "fa fa-bars",
        title: "收起/展开"
      }
    ],
    placeholder: "开始记录你的想法...",
    minHeight: "300px"
  });

  // 工具栏样式修复
  const easyMDEToolbar = document.querySelector('.editor-toolbar');
  const mainToolbar = document.querySelector('.toolbar');
  const rightTools = document.querySelector('.tool-right');
  if (easyMDEToolbar && mainToolbar && rightTools) {
    easyMDEToolbar.style.border = 'none';
    easyMDEToolbar.style.padding = '0';
    mainToolbar.insertBefore(easyMDEToolbar, rightTools);
  }

  // 数据同步
  easyMDE.codemirror.on("change", () => {
    if (isLoadingNote) return;
    const val = easyMDE.value();
    if (currentNoteId) {
      const note = notes.find(n => n.id == currentNoteId);
      if (note) {
        note.content = val;
        note.updateTime = Date.now();
        saveAllToLocalStorage();
        const activeItem = document.querySelector('.note-item.active');
        if (activeItem) {
          const previewDiv = activeItem.querySelector('.note-preview');
          if (previewDiv) previewDiv.textContent = val.replace(/[#*`]/g, '').replace(/\n/g, ' ').substring(0, 50) || '无内容';
          const dateDiv = activeItem.querySelector('.note-date');
          if (dateDiv) dateDiv.textContent = '刚刚';
        }
      }
    }
  });

  // 粘贴图片
  easyMDE.codemirror.on("paste", function (editor, e) {
    if (!(e.clipboardData && e.clipboardData.items)) return;
    for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
      let item = e.clipboardData.items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        let blob = item.getAsFile();
        let reader = new FileReader();
        reader.onload = function (event) {
          editor.replaceSelection(`\n![粘贴的图片](${event.target.result})\n`);
          CodeMirror.signal(editor, "change", editor);
        };
        reader.readAsDataURL(blob);
        return;
      }
    }
  });
}