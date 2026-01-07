// ============================================================================
// 【模块B】工具函数 & DOM 🔧 (Utilities)
// ============================================================================

// 1. DOM元素获取 (全局常量)
const sidebar = document.querySelector('.sidebar');
const folderListEl = document.getElementById('folder-list');
const addFolderBtn = document.getElementById('add-folder-btn');
const listTitleEl = document.querySelector('.list-header-top h2');
const folderToggleBtn = document.getElementById('folder-toggle-btn');
const folderHeader = document.querySelector('.folder-header');

const noteListEl = document.querySelector('.note-list');
const noteCountEl = document.querySelector(".count-text");
const sortActionBtn = document.querySelector('.sort-action');
const searchInput = document.querySelector('.search-box input');
const addNoteBtn = document.querySelector('.add-circle-btn');

const deleteBtn = document.querySelector('.delete-btn');
const editorTitle = document.getElementById('note-title');
const editorContent = document.getElementById('note-content');
const undoBtn = document.getElementById('undo-btn');

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileBackBtn = document.getElementById('mobile-back-btn');
const appContainer = document.querySelector('.app');

// 2. 工具函数

/**
 * 时间格式化
 */
function formatTime(timestamp) {
  if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    if (isNaN(parsed)) return timestamp;
  }
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;

  const now = new Date();
  const diff = now - date;

  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + '分钟前';

  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  const isThisYear = date.getFullYear() === now.getFullYear();
  const pad = (n) => n < 10 ? '0' + n : n;

  if (isToday) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  else if (isThisYear) return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
  else return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

/**
 * 关键词高亮
 */
function highlightText(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<span style="color: #10B981; font-weight: bold;">$1</span>');
}