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
let notes = [];
let categories = [];

try {
  // 尝试读取并解析
  const savedNotes = localStorage.getItem('notes');
  const savedCategories =localStorage.getItem('categories');

  // 如果有数据就解析，没有就使用默认
  notes = savedNotes ? JSON.parse(savedNotes) : defaultNotes;
  categories = savedCategories ? JSON.parse(savedCategories) : defaultCategories;

  // 二次校验：确保读出来的一定是数组（防止数据变成 null 或其他乱七八糟的）
  if (!Array.isArray(notes)) notes = defaultNotes;
  if (!Array.isArray(categories)) categories = defaultCategories;
} catch (error) {
  // 如果报错，回退默认状态
  console.error('本地数据损坏，已自动重置：', error);
  notes = defaultNotes;
  categories = defaultCategories;
  // 修复后应立即保存正确的默认数据
  saveAllToLocalStorage();
}

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
