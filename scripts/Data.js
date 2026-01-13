// ============================================================================
// 【模块A】数据层 📦 (Data Layer)
// ============================================================================

// 1. 默认数据
// 1. 默认数据
// 这是一个数组 [], 里面包含了一个对象 {}
// 这种结构叫 "JSON-like Object"，主要用来存储结构化数据
// id: 唯一标识符，就像身份证号，绝对不能重复
// updateTime: 时间戳 (Timestamp)，是一个长整数，表示从1970年到现在的毫秒数
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
// 只有在数据加载失败时，才会使用 defaultNotes
// 使用 'let' 而不是 'const'，因为这些变量后面会被修改（比如新增笔记）
let notes = [];
let categories = [];

try {
  // 尝试读取并解析
  // localStorage.getItem: 从浏览器的硬盘数据库里读出字符串
  const savedNotes = localStorage.getItem("notes");
  const savedCategories = localStorage.getItem("categories");

  // JSON.parse: 把 "字符串" 变回 "JS对象/数组"
  // 语法解释: 条件 ? 结果A : 结果B (三元运算符)
  // 意思是: 如果 savedNotes 存在(非空)，就解析它；否则使用 defaultNotes
  notes = savedNotes ? JSON.parse(savedNotes) : defaultNotes;
  categories = savedCategories
    ? JSON.parse(savedCategories)
    : defaultCategories;

  // 二次校验：确保读出来的一定是数组（防止数据变成 null 或其他乱七八糟的）
  // Array.isArray(notes): 判断变量是不是数组类型
  if (!Array.isArray(notes)) notes = defaultNotes;
  if (!Array.isArray(categories)) categories = defaultCategories;
} catch (error) {
  // 如果报错，回退默认状态
  console.error("本地数据损坏，已自动重置：", error);
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
 * 这是本模块最重要的函数。
 * 作用: 把内存里的 notes 数组，变成字符串，存进浏览器硬盘。
 * 为什么要 JSON.stringify? 因为 localStorage 只能存字符串，不能存对象。
 */
function saveAllToLocalStorage() {
  localStorage.setItem("notes", JSON.stringify(notes));
  localStorage.setItem("categories", JSON.stringify(categories));
}
