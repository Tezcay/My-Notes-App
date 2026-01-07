// ============================================================================
// 【模块A】数据层 📦 (Data Layer)
// ============================================================================

// 1. 默认数据
const defaultNotes = [
  {
    id: 1,
    title: "欢迎使用",
    content: "试着新建一个文件夹，把这条笔记拖进去（假装拖拽，其实是移动）...",
    updateTime: Date.now(),
    categoryId: "uncategorized",
  },
];

const defaultCategories = [
  {
    id: "folder-work",
    name: "工作资料",
  },
  {
    id: "folder-study",
    name: "学习笔记",
  },
];

// 2. 数据初始化 (优先读取 LocalStorage)
let notes = JSON.parse(localStorage.getItem("notes")) || defaultNotes;
let categories =
  JSON.parse(localStorage.getItem("categories")) || defaultCategories;

// 3. 数据迁移与兼容 (旧数据修复)
notes.forEach((note) => {
  if (note.updateTime === "刚刚") {
    note.updateTime = Date.now();
  }
});
saveAllToLocalStorage();

// 4. 全局状态
let currentCategoryId = "all";
let currentNoteId = null;
let currentSearchKeyword = "";
let currentSortMode = "timeDesc";
let isLoadingNote = false;

/**
 * 保存所有数据到LocalStorage
 */
function saveAllToLocalStorage() {
  localStorage.setItem("notes", JSON.stringify(notes));
  localStorage.setItem("categories", JSON.stringify(categories));
}
