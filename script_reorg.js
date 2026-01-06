// ============================================
// 馃摌 My Notes App - 鏍稿績鑴氭湰鏂囦欢
// ============================================
// 鐗堟湰: 2.0
// 浣滆€? 2023绾ц蒋浠跺伐绋嬩笓涓?
// 鏈€鍚庢洿鏂? 2026骞?鏈?鏃?
// ============================================

// ============================================
// MODULE A: DATA LAYER 馃摝 (鏁版嵁灞?
// ============================================
// 璐熻矗鏁版嵁妯″瀷瀹氫箟銆丩ocalStorage鎿嶄綔銆佺姸鎬佺鐞?
// ============================================

// A1. 榛樿鏁版嵁瀹氫箟
const defaultNotes = [
  {
    id: 1,
    title: "娆㈣繋浣跨敤",
    content: "璇曠潃鏂板缓涓€涓枃浠跺す锛屾妸杩欐潯绗旇鎷栬繘鍘伙紙鍋囪鎷栨嫿锛屽叾瀹炴槸绉诲姩锛?..",
    updateTime: Date.now(),
    categoryId: "uncategorized"
  }
];

const defaultCategories = [
  {
    id: "folder-work",
    name: "宸ヤ綔璧勬枡"
  },
  {
    id: "folder-study",
    name: "瀛︿範绗旇"
  }
];

// A2. 鏁版嵁鍔犺浇涓庡垵濮嬪寲
// 浼樺厛浠?LocalStorage 鑾峰彇鏁版嵁锛屽鏋滄病鏈夊垯浣跨敤榛樿鏁版嵁
let notes = JSON.parse(localStorage.getItem('notes')) || defaultNotes;
let categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;

// 鏁版嵁杩佺Щ锛氬皢鏃х殑 "鍒氬垰" 瀛楃涓茶浆鎹负褰撳墠鏃堕棿鎴筹紝浠ヤ究鍚敤鐩稿鏃堕棿鍔熻兘
notes.forEach(note => {
  if (note.updateTime === '鍒氬垰') {
    note.updateTime = Date.now();
  }
});
saveAllToLocalStorage(); // 淇濆瓨淇鍚庣殑鏁版嵁

// A3. 鍏ㄥ眬鐘舵€佸彉閲?
let currentCategoryId = "all"; // 褰撳墠閫変腑鐨勫垎绫籌D锛岄粯璁?all'
let currentNoteId = null; // 褰撳墠閫変腑鐨勭瑪璁癐D
let currentSearchKeyword = ''; // 褰撳墠鎼滅储鍏抽敭璇?
let currentSortMode = 'timeDesc'; // 褰撳墠鎺掑簭妯″紡: timeDesc, timeAsc, titleAsc
let isLoadingNote = false; // 瀹氫箟涓€涓姞杞介攣鐘舵€?

// --- DOM鍏冪礌鑾峰彇 ---

// 渚ц竟鏍忕浉鍏?
const sidebar = document.querySelector('.sidebar'); // 宸︿晶鏁翠釜渚ц竟鏍?鐢ㄤ簬浜嬩欢濮旀墭)
const folderListEl = document.getElementById('folder-list'); // 鑷畾涔夋枃浠跺す鍒楄〃瀹瑰櫒
const addFolderBtn = document.getElementById('add-folder-btn'); // 宸︿晶鏂板鏂囦欢澶规寜閽?
const listTitleEl = document.querySelector('.list-header-top h2'); // 涓棿椤堕儴鏍囬
// const navItems = document.querySelectorAll('.nav-item'); // 宸︿晶瀵艰埅椤?

// 涓棿绗旇鍒楄〃鐩稿叧
const noteListEl = document.querySelector('.note-list'); // 涓棿绗旇鍒楄〃瀹瑰櫒
const noteCountEl = document.querySelector(".count-text"); // 涓棿鍏眡x鏉＄瑪璁?
const sortActionBtn = document.querySelector('.sort-action'); // 鎺掑簭鎸夐挳
const searchInput = document.querySelector('.search-box input'); // 鎼滅储杈撳叆妗?
const addNoteBtn = document.querySelector('.add-circle-btn'); // 涓棿榛勮壊鐨勬柊澧炴寜閽?

// 鍙充晶缂栬緫鍣ㄧ浉鍏?
const deleteBtn = document.querySelector('.delete-btn'); // 鍙充笂瑙掔殑鍒犻櫎鎸夐挳
const editorTitle = document.getElementById('note-title');
const editorContent = document.getElementById('note-content');

// ============================================
// MODULE B: UTILITIES 馃敡 (宸ュ叿鍑芥暟)
// ============================================
// 鎻愪緵鏃堕棿鏍煎紡鍖栥€佹枃鏈珮浜瓑閫氱敤宸ュ叿鍑芥暟
// ============================================

// B1. 鏁版嵁鎸佷箙鍖?
/**
 * 淇濆瓨鎵€鏈夋暟鎹埌 LocalStorage
 * @description 姣忔鏁版嵁鍙樻洿鍚庤皟鐢ㄦ鍑芥暟杩涜鎸佷箙鍖?
 */
function saveAllToLocalStorage() {
  localStorage.setItem('notes', JSON.stringify(notes));
  localStorage.setItem('categories', JSON.stringify(categories));
}

// B2. 鏃堕棿鏍煎紡鍖?
/**
 * 灏嗘椂闂存埑鏍煎紡鍖栦负浜虹被鍙鐨勭浉瀵规椂闂?
 * @param {number|string} timestamp - 姣鏃堕棿鎴虫垨鏃堕棿瀛楃涓?
 * @return {string} 鏍煎紡鍖栧悗鐨勬椂闂村瓧绗︿覆锛堝"鍒氬垰"銆?5鍒嗛挓鍓?銆?10:30"銆?01/15"锛?
 */
function formatTime(timestamp) {
  // 鍏煎鏃ф暟鎹細濡傛灉鏄瓧绗︿覆涓旀棤娉曡浆涓烘湁鏁堟棩鏈燂紙渚嬪 "鍒氬垰"锛夛紝鐩存帴杩斿洖
  if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    if (isNaN(parsed)) {
      return timestamp;
    }
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp; // 鍙岄噸淇濋櫓

  const now = new Date();
  const diff = now - date; // Time difference in milliseconds

  // Less than 1 minute: Just now
  if (diff < 60 * 1000) {
    return '鍒氬垰';
  }

  // Less than 1 hour: xx minutes ago
  if (diff < 60 * 60 * 1000) {
    return Math.floor(diff / (60 * 1000)) + '鍒嗛挓鍓?;
  }

  const isToday = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const isThisYear = date.getFullYear() === now.getFullYear();

  // Helper: pad with zero
  const pad = (n) => n < 10 ? '0' + n : n;

  if (isToday) {
    // Today: HH:MM
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } else if (isThisYear) {
    // This Year: MM/DD
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
  } else {
    // Other: YYYY/MM/DD
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
  }
}

// B3. 鏂囨湰楂樹寒澶勭悊
/**
 * 鍦ㄦ枃鏈腑楂樹寒鏄剧ず鎼滅储鍏抽敭璇?
 * @param {string} text - 鍘熸枃鏈?
 * @param {string} keyword - 瑕侀珮浜殑鍏抽敭璇?
 * @return {string} 鍖呭惈HTML鏍囩鐨勯珮浜枃鏈?
 */
function highlightText(text, keyword) {
  // 濡傛灉娌℃悳璇嶏紝鐩存帴杩斿洖鍘熸枃鏈?
  if (!keyword) return text;

  // 浣跨敤姝ｅ垯杩涜鏇挎崲 (gi 琛ㄧず鍏ㄥ眬 + 蹇界暐澶у皬鍐?
  const regex = new RegExp(`(${keyword})`, 'gi');

  // 鎶婂尮閰嶅埌鐨勯儴鍒嗗彉鎴?缁胯壊+鍔犵矖
  return text.replace(regex, '<span style="color: #10B981; font-weight: bold;">$1</span>');
}

// ============================================
// MODULE C: UI RENDER 馃帹 (UI娓叉煋灞?
// ============================================
// 璐熻矗DOM鍏冪礌娓叉煋銆佸垪琛ㄦ洿鏂般€佺晫闈㈠埛鏂扮瓑
// ============================================

// C1. 娓叉煋鏂囦欢澶瑰垪琛?
/**
 * 娓叉煋宸︿晶"鎴戠殑鏂囦欢澶?鍒楄〃
 * @description 鏀寔鍙抽敭鑿滃崟銆佹嫋鎷芥斁缃瓑浜や簰
 */
function renderFolderList() {
  // 娓呯┖鐜版湁鍒楄〃
  folderListEl.innerHTML = '';

  // 鐢熸垚 HTML
  categories.forEach(category => {
    const li = document.createElement('li');
    li.className = 'nav-item sub-item';
    li.dataset.id = category.id; // 瀛樺偍 ID 鍒?data 灞炴€?

    // 妫€鏌ユ槸鍚﹁閫変腑
    if (currentCategoryId === category.id) {
      li.classList.add('active');
    }

    li.innerHTML = `
      <span class="icon"><i class="fa-regular fa-folder"></i></span>
      <span class="text">${category.name}</span>
    `;

    // 鍙抽敭鐐瑰嚮浜嬩欢锛氬懠鍑鸿彍鍗?淇敼鐗?
    li.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // 闃绘榛樿娴忚鍣ㄨ彍鍗?
      showContextMenu(e, category.id); // 鍛煎嚭鎴戜滑鐨勮彍鍗?
    });

    // 鎷栨斁鐩爣浜嬩欢
    li.addEventListener('dragover', (e) => {
      e.preventDefault(); // 鍏佽鏀剧疆
      li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      const noteId = parseInt(e.dataTransfer.getData('text/plain')); // ID鍙互鏄瓧绗︿覆
      handleMoveNoteToCategory(noteId, category.id);
    });

    folderListEl.appendChild(li);
  });

  // 鍚屾椂鏇存柊闈欐€佸鑸」鐨勯€変腑鐘舵€侊紙鍏ㄩ儴銆佹湭鍒嗙被绛夛級
  updateStaticNavHighlight();
}

// C2. 娓叉煋绗旇鍒楄〃
/**
 * 娓叉煋涓棿鏍忕殑绗旇鍒楄〃
 * @description 鍖呭惈鎼滅储杩囨护銆佸垎绫荤瓫閫夈€佹帓搴忋€佺┖鐘舵€佸鐞嗐€佸叧閿瘝楂樹寒绛夊姛鑳?
 */
function renderNoteList() {
  // 1. 鑱斿悎绛涢€夛細鏃㈣绗﹀悎鈥滃垎绫烩€濓紝鍙堣绗﹀悎鈥滄悳绱㈣瘝鈥?
  const filteredNotes = notes.filter(note => {
    // A. 鎼滅储璇嶇瓫閫?
    // 鎶婃爣棰樺拰鍐呭鎷煎湪涓€璧锋悳锛屽彧瑕佹湁涓€涓寘鍚叧閿瘝灏辩畻鍖归厤
    const contentToSearch = (note.title + note.content).toLowerCase();
    const keyword = currentSearchKeyword.toLowerCase();

    // 濡傛灉鎼滀笉鍒帮紝鐩存帴娣樻卑
    if (!contentToSearch.includes(keyword)) return false;

    // B. 鍒嗙被绛涢€?
    // 1. 鍥炴敹绔?
    if (currentCategoryId === "trash") return note.categoryId === "trash";
    // 2. 涓嶅湪鍥炴敹绔?
    if (note.categoryId === "trash") return false;
    // 3. 鍦ㄥ叏閮ㄧ瑪璁伴噷闅愯棌绉佸瘑绗旇
    if (currentCategoryId === "all") {
      return note.categoryId !== 'private';
    }
    // 4. 鍏朵粬鏅€氭儏鍐?
    return note.categoryId === currentCategoryId;
  });

  // 1.5 鎺掑簭閫昏緫
  filteredNotes.sort((a, b) => {
    switch (currentSortMode) {
      case 'timeDesc': // 鏃堕棿鍊掑簭锛堟渶鏂板湪鍓嶏級
        return new Date(b.updateTime) - new Date(a.updateTime);
      case 'timeAsc': // 鏃堕棿姝ｅ簭锛堟棫鐨勫湪鍓嶏級
        return new Date(a.updateTime) - new Date(b.updateTime);
      case 'titleAsc': // 鏍囬 A-Z
        return (a.title || '').localeCompare(b.title || '', 'zh-CN');
      default:
        return 0;
    }
  });

  // 2. 鏇存柊椤堕儴缁熻
  if (noteCountEl) {
    noteCountEl.textContent = `鍏?${filteredNotes.length} 鏉＄瑪璁癭;
  }

  // 3. 娓呯┖鍒楄〃
  noteListEl.innerHTML = '';

  // 4. 绌虹姸鎬佸鐞?
  if (filteredNotes.length === 0) {
    // 濡傛灉鏄洜涓烘悳绱㈡病缁撴灉
    if (currentSearchKeyword) {
      noteListEl.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">鏈悳绱㈠埌鐩稿叧绗旇</div>';
    } else {
      // 涔嬪墠鐨勭┖鐘舵€侀€昏緫
      const emptyIcon = currentCategoryId === 'trash' ? 'fa-trash-can' : 'fa-box-open';
      const emptyText = currentCategoryId === 'trash' ? '鍥炴敹绔欓噷娌℃湁绗旇' : '杩欓噷绌虹┖濡備篃锛屽揩鍘昏鐐逛粈涔堝惂';
      noteListEl.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ccc; padding-top: 60px;">
            <i class="fa-solid ${emptyIcon}" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
            <div style="font-size: 14px;">${emptyText}</div>
          </div>`;
    }
    return;
  }

  // 5. 鐢熸垚鍒楄〃 (甯﹂珮浜?)
  filteredNotes.forEach(note => {
    const li = document.createElement('li');
    li.dataset.id = note.id; // 鏂逛究浠ュ悗绮剧‘鎵惧埌瀹?
    li.className = 'note-item';
    if (note.id === currentNoteId) li.classList.add('active');

    // 璁剧疆鍙嫋鍔?
    li.draggable = true;
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', note.id.toString());
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
    });

    // 鍏抽敭鐐癸細璋冪敤 highlightText 澶勭悊鏍囬鍜岄瑙?
    const displayTitle = highlightText(note.title || '鏃犳爣棰?, currentSearchKeyword);
    const displayContent = highlightText(note.content || '鏃犲唴瀹?, currentSearchKeyword);

    li.innerHTML = `
      <div class="note-title">${displayTitle}</div>
      <div class="note-preview">${displayContent}</div>
      <div class="note-date">${formatTime(note.updateTime)}</div>
    `;

    li.addEventListener('click', () => {
      currentNoteId = note.id;
      renderNoteList();
      loadNoteToEditor(note);

      // 鎵嬫満绔嚜鍔ㄨ繘鍏ョ紪杈戞ā寮?
      document.querySelector('.app').classList.add('mobile-editing');
    });

    noteListEl.appendChild(li);
  });
}

// C3. 鏇存柊闈欐€佸鑸珮浜?
/**
 * 鏇存柊闈欐€佸鑸」鐨勯€変腑鐘舵€?
 * @description 缁存姢鍏ㄩ儴绗旇銆佹湭鍒嗙被銆佸洖鏀剁珯绛夊浐瀹氬鑸」鐨勬縺娲荤姸鎬?
 */
function updateStaticNavHighlight() {
  const allNavItems = document.querySelectorAll('.nav-item');
  allNavItems.forEach(item => {
    if (currentCategoryId === item.dataset.id) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// ============================================
// MODULE D: EVENT HANDLERS 鈿?(浜嬩欢澶勭悊灞?
// ============================================
// 璐熻矗鐢ㄦ埛浜や簰銆佷簨浠剁洃鍚€佷笟鍔￠€昏緫澶勭悊
// ============================================

// D1. 鍒嗙被鍒囨崲閫氱敤鍑芥暟
/**
 * 鍒囨崲褰撳墠閫変腑鐨勫垎绫?
 * @param {string} id - 鍒嗙被ID
 * @param {string} name - 鍒嗙被鍚嶇О
 * @description 缁熶竴澶勭悊鍒嗙被鍒囨崲閫昏緫锛屽寘鎷姸鎬佹洿鏂般€乁I鍒锋柊銆佺紪杈戝櫒娓呯┖绛?
 */
function switchCategory(id, name) {
  // 1. 鏇存柊鐘舵€?
  currentCategoryId = id;
  currentNoteId = null; // 娓呴櫎閫変腑绗旇

  // 2. 鏇存柊UI
  listTitleEl.textContent = name;
  renderFolderList(); // 鏇存柊楂樹寒
  renderNoteList();   // 鍒锋柊鍒楄〃

  // 3. 娓呯┖缂栬緫鍣?
  editorTitle.value = '';
  if (typeof easyMDE !== 'undefined') {
    easyMDE.value("");
  }

  // 4. 鎵嬫満绔嚜鍔ㄦ敹璧蜂晶杈规爮
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('open');
  }
}

// A. 渚ц竟鏍忕偣鍑婚€昏緫 (浣跨敤浜嬩欢濮旀墭锛屽鐞嗗姩鎬佺敓鎴愮殑鍏冪礌)
sidebar.addEventListener('click', (e) => {
  // 鎵惧埌琚偣鍑荤殑.nav-item鍏冪礌
  const navItem = e.target.closest('.nav-item');

  if (navItem) {
    const targetId = navItem.dataset.id;
    const targetName = navItem.querySelector('.text').textContent;

    // 鎷︽埅
    if (targetId === 'private') {
      handlePrivateAccess(targetId, targetName);
      return; // 闃绘鍚庣画鍒囨崲
    }

    // 鏅€氬垎绫荤洿鎺ュ垏鎹?
    switchCategory(targetId, targetName);
  }
});

// B0. 鏂囦欢澶瑰垪琛ㄥ睍寮€/鏀惰捣鎸夐挳鐐瑰嚮浜嬩欢
const folderToggleBtn = document.getElementById('folder-toggle-btn');
const folderHeader = document.querySelector('.folder-header');

if (folderToggleBtn && folderListEl) {
  folderToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 闃绘浜嬩欢鍐掓场锛岄伩鍏嶈Е鍙戜晶杈规爮鐐瑰嚮浜嬩欢

    // 1. 鍒囨崲鍒楄〃鐨?collapsed 绫?
    folderListEl.classList.toggle('collapsed');

    // 2. 鍒囨崲澶撮儴鐨?collapsed 绫?(鐢ㄤ簬鏃嬭浆绠ご)
    folderHeader.classList.toggle('collapsed');
  });
}

// D2. 鏂板缓鏂囦欢澶逛簨浠?
// 浣跨敤鑷畾涔夊脊绐楀垱寤烘柊鏂囦欢澶?
if (addFolderBtn) {
  addFolderBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // 璋冪敤鍒氬啓鐨勬紓浜脊绐?
    showModal('鏂板缓鏂囦欢澶?, '璇疯緭鍏ユ枃浠跺す鍚嶇О', (folderName) => {
      // 杩欓噷鏄偣纭畾鍚庢墽琛岀殑閫昏緫 (鍜屽師鏉ヤ竴鏍?
      const newCategory = {
        id: 'folder-' + Date.now(),
        name: folderName
      };
      categories.push(newCategory);
      saveAllToLocalStorage();
      renderFolderList();
    });
  });
}

// D3. 鍒犻櫎鏂囦欢澶瑰鐞?
/**
 * 鍒犻櫎鏂囦欢澶瑰強澶勭悊鍏朵笅鐨勭瑪璁?
 * @param {Object} category - 瑕佸垹闄ょ殑鍒嗙被瀵硅薄
 * @description 鍒犻櫎鏂囦欢澶规椂灏嗗叾涓嬬瑪璁扮Щ鑷?鏈垎绫?
 */
function handleDeleteFolder(category) {
  if (confirm(`纭畾瑕佸垹闄ゆ枃浠跺す "${category.name}" 鍙婂叾鎵€鏈夌瑪璁板悧锛焋)) {
    // 1. 鎵惧埌灞炰簬璇ュ垎绫荤殑鎵€鏈夌瑪璁帮紝鎶婂畠浠Щ鍒?'uncategorized'
    notes.forEach(note => {
      if (note.categoryId === category.id) {
        note.categoryId = 'uncategorized';
      }
    });

    // 2. 浠庡垎绫绘暟缁勪腑鍒犻櫎璇ュ垎绫?
    categories = categories.filter(c => c.id !== category.id);

    // 3. 濡傛灉褰撳墠鍒嗙被鏄鍒犻櫎鐨勫垎绫伙紝鍒囨崲鍒?all'
    if (currentCategoryId === category.id) {
      currentCategoryId = 'all';
      listTitleEl.textContent = '鍏ㄩ儴绗旇';
    }

    // 4. 淇濆瓨鏁版嵁骞跺埛鏂?
    saveAllToLocalStorage();
    renderFolderList();
    renderNoteList();
  }
}

// D4. 绉诲姩绗旇鍒版寚瀹氬垎绫?
/**
 * 鎷栨嫿绉诲姩绗旇鍒版寚瀹氬垎绫?
 * @param {string|number} noteId - 绗旇ID
 * @param {string} categoryId - 鐩爣鍒嗙被ID
 * @description 鏀寔鎷栧叆鍥炴敹绔欑‘璁ゃ€侀槻姝㈤噸澶嶇Щ鍔?
 */
function handleMoveNoteToCategory(noteId, categoryId) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  // 濡傛灉宸茬粡鍦ㄨ繖涓垎绫伙紝涓嶅仛浠讳綍鎿嶄綔
  if (note.categoryId === categoryId) return;

  // 馃敟 鐗规畩澶勭悊锛氭嫋鍏ュ洖鏀剁珯鏃堕渶瑕佺‘璁?
  if (categoryId === 'trash') {
    if (!confirm(`纭畾瑕佸皢绗旇 "${note.title}" 绉诲姩鍒板洖鏀剁珯鍚? `)) {
      return; // 鐢ㄦ埛鍙栨秷
    }
  }

  note.categoryId = categoryId;
  note.updateTime = Date.now();
  saveAllToLocalStorage();
  renderNoteList();

  // 鍙€夛細鏄剧ず涓€涓畝鐭殑鎻愮ず
  console.log(`绗旇 "${note.title}" 宸茬Щ鍔ㄥ埌鏂板垎绫籤);
}

// D5. 鏂板绗旇浜嬩欢
// 鍒涘缓鏂扮瑪璁板苟鑷姩鍒嗛厤鍒板綋鍓嶅垎绫?
if (addNoteBtn) {
  addNoteBtn.addEventListener('click', () => {
    // 1. 鍒涘缓鏂扮瑪璁板璞?
    const newId = String(Date.now()); // 浣跨敤鏃堕棿鎴充綔涓哄敮涓€ID -> 杞崲涓哄瓧绗︿覆
    // 纭畾鏂扮瑪璁扮殑鍒嗙被锛氬鏋滄槸鍏ㄩ儴/鏈垎绫伙紝褰掑叆鏈垎绫伙紱鍚﹀垯褰掑叆褰撳墠閫変腑鐨勬枃浠跺す
    let targetCategoryId = currentCategoryId;
    if (currentCategoryId === "all" || currentCategoryId.startsWith('todo')) {
      targetCategoryId = "uncategorized";
    }

    const newNote = {
      id: newId,
      title: '鏂板缓绗旇',
      content: '',
      updateTime: Date.now(),
      // 濡傛灉褰撳墠鍒嗙被鏄?all'锛屽垯榛樿鍒嗙被涓?uncategorized', 鍚﹀垯涓哄綋鍓嶅垎绫?
      categoryId: targetCategoryId
    };

    // 2. 娣诲姞鍒版暟鎹暟缁勬渶鍓嶉潰
    notes.unshift(newNote);
    // 淇濆瓨鏁版嵁鍒?LocalStorage
    saveAllToLocalStorage();

    // 3. 閫変腑杩欎釜鏂扮瑪璁?
    currentNoteId = newId;
    // 濡傛灉褰撳墠鍦?鍏ㄩ儴"瑙嗗浘锛屾垨鑰呭氨鍦ㄧ洰鏍囪鍥撅紝鐩存帴娓叉煋
    // 濡傛灉褰撳墠鍦ㄥ埆鐨勮鍥撅紙寰堝皯瑙侊級锛屼负浜嗕綋楠岋紝寮鸿鍒囪繃鍘讳篃琛岋紝杩欓噷淇濇寔褰撳墠瑙嗗浘閫昏緫

    // 4. 閲嶆柊娓叉煋绗旇鍒楄〃
    renderNoteList();

    // 5. 鍔犺浇鏂扮瑪璁板埌缂栬緫鍣?
    loadNoteToEditor(newNote);

    // 6. 鑷姩鑱氱劍鏍囬杈撳叆妗? 鏂逛究鐩存帴杈撳叆
    editorTitle.focus();
  });
}

// D6. 鏍囬杈撳叆瀹炴椂淇濆瓨
// 鐩戝惉鏍囬鍙樺寲骞跺嵆鏃朵繚瀛?
if (editorTitle) {
  editorTitle.addEventListener('input', (e) => {
    if (currentNoteId) {
      const note = notes.find(n => n.id === currentNoteId);
      if (note) {
        // 1. 鏇存柊鍐呭瓨鏁版嵁
        note.title = e.target.value;
        note.updateTime = Date.now();

        // 2. 馃敟 瀛樿繘纭洏锛?
        saveAllToLocalStorage();

        // 3. 鍙洿鏂板乏渚у垪琛ㄩ噷褰撳墠杩欎竴椤圭殑鏂囧瓧 (涓嶉噸鎺掑垪琛?
        const activeTitle = document.querySelector(`.note-item[data-id="${currentNoteId}"] .note-title`);
        if (activeTitle) {
          activeTitle.textContent = note.title || '鏃犳爣棰?;
        }
      }
    }
  });
}

// D7. 鍒犻櫎绗旇浜嬩欢
// 鏀寔绉诲叆鍥炴敹绔欏拰姘镐箙鍒犻櫎涓ょ妯″紡
if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    if (!currentNoteId) {
      alert('璇峰厛閫夋嫨涓€鏉¤鍒犻櫎鐨勭瑪璁?);
      return;
    }

    const currentNote = notes.find(n => n.id == currentNoteId);
    if (!currentNote) return;

    // 鍦烘櫙 A锛氫粠鍥炴敹绔欐案涔呭垹闄?
    if (currentCategoryId === "trash") {
      showConfirm('姘镐箙鍒犻櫎', '纭畾瑕佹案涔呴攢姣佽繖鏉＄瑪璁板悧锛熸鎿嶄綔鏃犳硶鎾ら攢銆?, () => {
        // 鎵ц鍒犻櫎閫昏緫
        notes = notes.filter(n => n.id != currentNoteId);
        saveAllToLocalStorage();
        resetEditor(); // 寮哄姏娓呯┖
        renderNoteList();
      });
      return;
    }

    // 鍦烘櫙 B锛氱Щ鍏ュ洖鏀剁珯
    showConfirm('绉诲叆鍥炴敹绔?, '纭畾瑕佸皢杩欐潯绗旇涓㈣繘鍥炴敹绔欏悧锛?, () => {
      // 鎵ц绉诲姩閫昏緫
      currentNote.categoryId = "trash";
      currentNote.updateTime = Date.now();
      saveAllToLocalStorage();
      resetEditor(); // 寮哄姏娓呯┖
      renderNoteList();
    });
  });
}

// D8. 鎼滅储鍔熻兘
// 瀹炴椂鎼滅储绗旇鏍囬鍜屽唴瀹?
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    // 1. 鏇存柊鍏ㄥ眬鎼滅储璇嶇姸鎬?
    currentSearchKeyword = e.target.value.trim();

    // 2. 閲嶆柊娓叉煋鍒楄〃 (renderNoteList 浼氳嚜宸卞幓璇?currentSearchKeyword)
    renderNoteList();
  });
}

// D9. 鎺掑簭鍒囨崲鍔熻兘
// 鍦ㄦ椂闂村€掑簭/姝ｅ簭/鏍囬鎺掑簭涔嬮棿寰幆鍒囨崲
if (sortActionBtn) {
  sortActionBtn.addEventListener('click', () => {
    // Cycle: timeDesc -> timeAsc -> titleAsc -> timeDesc
    if (currentSortMode === 'timeDesc') {
      currentSortMode = 'timeAsc';
      sortActionBtn.innerHTML = '鎸夋椂闂存搴?<i class="fa-solid fa-arrow-up"></i>';
    } else if (currentSortMode === 'timeAsc') {
      currentSortMode = 'titleAsc';
      sortActionBtn.innerHTML = '鎸夋爣棰樺悕绉?<i class="fa-solid fa-arrow-down-a-z"></i>';
    } else {
      currentSortMode = 'timeDesc';
      sortActionBtn.innerHTML = '鎸夌紪杈戞椂闂?<i class="fa-solid fa-caret-down"></i>';
    }
    renderNoteList();
  });
}
    }
  };
}

// 鍥炶溅閿敮鎸?(鍙湪杈撳叆妯″紡涓嬬敓鏁?
if (modalInput) {
  modalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') modalConfirmBtn.click();
  });
}

/**
 * 鍒濆鍖栦富棰?
 * @description 浠巐ocalStorage璇诲彇鐢ㄦ埛涓婚鍋忓ソ骞跺簲鐢?
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon(true);
  } else {
    document.documentElement.removeAttribute('data-theme');
    updateThemeIcon(false);
  }
}

/**
 * 鏇存柊涓婚鎸夐挳鍥炬爣
 * @param {boolean} isDark - 鏄惁涓烘繁鑹叉ā寮?
 */
function updateThemeIcon(isDark) {
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('i');
    if (isDark) {
      icon.className = 'fa-solid fa-sun'; // 娣辫壊妯″紡鏄剧ず澶槼
    } else {
      icon.className = 'fa-solid fa-moon'; // 娴呰壊妯″紡鏄剧ず鏈堜寒
    }
  }
}

/**
 * 鍒囨崲涓婚妯″紡
 * @description 鍦ㄦ繁鑹插拰娴呰壊妯″紡涔嬮棿鍒囨崲锛屽苟淇濆瓨鍋忓ソ鍒發ocalStorage
 */
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    updateThemeIcon(false);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    updateThemeIcon(true);
  }
}

// 缁戝畾鐐瑰嚮浜嬩欢
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', toggleTheme);
}

// 椤甸潰鍔犺浇鏃跺垵濮嬪寲涓婚
initTheme();

// ============================================
// MODULE E: EDITOR INTEGRATION 馃摑 (缂栬緫鍣ㄩ泦鎴?
// ============================================
// EasyMDE Markdown缂栬緫鍣ㄧ殑鍒濆鍖栥€侀厤缃€佷簨浠跺鐞?
// ============================================

// E2. 鍔犺浇绗旇鍒扮紪杈戝櫒
/**
 * 鍔犺浇绗旇鍐呭鍒扮紪杈戝櫒
 * @param {Object} note - 绗旇瀵硅薄
 * @description 馃敀 浣跨敤鍔犺浇閿侀槻姝㈣Е鍙戣嚜鍔ㄤ繚瀛樹簨浠?
 */
function loadNoteToEditor(note) {
  // 1. 涓婇攣锛氬憡璇夌郴缁?姝ｅ湪鍔犺浇锛屼笉鏄敤鎴峰湪鎵撳瓧"
  isLoadingNote = true;

  currentNoteId = note.id;

  // 鏇存柊鏍囬杈撳叆妗?
  editorTitle.value = note.title;

  // 鏇存柊缂栬緫鍣ㄥ唴瀹?
  if (easyMDE) {
    easyMDE.value(note.content || "");

    // 鈴?寤惰繜瑙ｉ攣锛氱瓑缂栬緫鍣ㄦ覆鏌撳畬浜嗭紝鍐嶆妸閿佹墦寮€
    // (杩欐槸涓轰簡闃叉 easyMDE 璁剧疆鍊兼椂鐬棿瑙﹀彂 change 浜嬩欢)
    setTimeout(() => {
      isLoadingNote = false;
    }, 200);
  }

  // 绉诲姩绔€昏緫 (淇濇寔涓嶅彉)
  const container = document.querySelector('.editor-container');
  container.classList.remove('preview-mode');
  editorTitle.disabled = false;
}

// E3. 鍐呭瀹炴椂淇濆瓨鐩戝惉
// 鐩戝惉鏍囬鍜屽唴瀹圭殑杈撳叆鍙樺寲锛岃嚜鍔ㄤ繚瀛?
[editorTitle, editorContent].forEach(input => {
  input.addEventListener('input', () => {
    // 濡傛灉娌℃湁閫変腑绗旇锛屼笉鍏佽缂栬緫
    if (!currentNoteId) return;

    // 鑾峰彇褰撳墠缂栬緫鐨勭瑪璁板璞?
    const currentNote = notes.find(n => n.id === currentNoteId);

    if (currentNote) {
      // 鏇存柊鏁版嵁
      currentNote.title = editorTitle.value;
      currentNote.content = editorContent.value;
      currentNote.updateTime = Date.now(); // 瀛樻椂闂存埑

      // 淇濆瓨鏁版嵁鍒?LocalStorage
      saveAllToLocalStorage();
      // 閲嶆柊娓叉煋绗旇鍒楄〃锛屾洿鏂伴瑙堝拰鏃堕棿
      renderNoteList();

      // 閲嶇粯鍚庣劍鐐瑰彲鑳戒細涓㈠け锛岀畝鍗曞鐞嗭細淇濇寔 focus 鐘舵€?(娴忚鍣ㄩ粯璁よ涓洪€氬父鑳戒繚鎸?
      // 濡傛灉鍙戠幇杈撳叆鍗￠】鎴栫劍鐐逛涪澶憋紝鍙互浼樺寲杩欓噷鐨勯€昏緫
    }
  });
});

// E4. EasyMDE缂栬緫鍣ㄥ垵濮嬪寲
let easyMDE = null;

if (document.getElementById('note-content')) {
  easyMDE = new EasyMDE({
    element: document.getElementById('note-content'),
    spellChecker: false,
    status: false,
    autofocus: false,
    hideIcons: ['fullscreen', 'side-by-side'], // 鍙殣钘忔湁闂鐨剆ide-by-side
    // 鑷畾涔夊伐鍏锋爮閰嶇疆
    toolbar: [
      {
        name: "bold",
        action: EasyMDE.toggleBold,
        className: "fa fa-bold",
        title: "鍔犵矖 Ctrl+B"
      },
      {
        name: "italic",
        action: EasyMDE.toggleItalic,
        className: "fa fa-italic",
        title: "鏂滀綋 Ctrl+I"
      },
      {
        name: "strikethrough",
        action: EasyMDE.toggleStrikethrough,
        className: "fa fa-strikethrough",
        title: "鍒犻櫎绾?
      },
      "|",
      {
        name: "heading-1",
        action: EasyMDE.toggleHeading1,
        className: "fa fa-header fa-heading-1",
        title: "涓€绾ф爣棰?
      },
      {
        name: "heading-2",
        action: EasyMDE.toggleHeading2,
        className: "fa fa-header fa-heading-2",
        title: "浜岀骇鏍囬"
      },
      {
        name: "heading-3",
        action: EasyMDE.toggleHeading3,
        className: "fa fa-header fa-heading-3",
        title: "涓夌骇鏍囬"
      },
      "|",
      {
        name: "quote",
        action: EasyMDE.toggleBlockquote,
        className: "fa fa-quote-left",
        title: "寮曠敤"
      },
      {
        name: "unordered-list",
        action: EasyMDE.toggleUnorderedList,
        className: "fa fa-list-ul",
        title: "鏃犲簭鍒楄〃"
      },
      {
        name: "ordered-list",
        action: EasyMDE.toggleOrderedList,
        className: "fa fa-list-ol",
        title: "鏈夊簭鍒楄〃"
      },
      "|",
      {
        name: "code",
        action: EasyMDE.toggleCodeBlock,
        className: "fa fa-code",
        title: "浠ｇ爜鍧?
      },
      {
        name: "link",
        action: EasyMDE.drawLink,
        className: "fa fa-link",
        title: "鎻掑叆閾炬帴 Ctrl+K"
      },
      {
        name: "upload-image",
        action: function uploadImage(editor) {
          // 鍒涘缓闅愯棌鐨勬枃浠惰緭鍏?
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              // 妫€鏌ユ枃浠跺ぇ灏忥紙闄愬埗500KB锛?
              if (file.size > 500 * 1024) {
                alert('鍥剧墖澶у皬涓嶈兘瓒呰繃500KB锛岃閫夋嫨鏇村皬鐨勫浘鐗?);
                return;
              }

              // 璇诲彇鍥剧墖骞惰浆涓篵ase64
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target.result;
                const cm = editor.codemirror;
                const pos = cm.getCursor();
                const imageMarkdown = `![${file.name}](${base64})`;
                cm.replaceRange(imageMarkdown, pos);
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        },
        className: "fa fa-image",
        title: "涓婁紶鍥剧墖(鏈湴)"
      },
      "|",
      {
        name: "preview",
        action: function customPreview(editor) {
          const container = document.querySelector('.editor-container');
          const previewArea = document.getElementById('note-preview-area');
          const isPreview = container.classList.contains('preview-mode');

          // 1. 鎵惧埌棰勮鎸夐挳 (鏃犺瀹冪幇鍦ㄦ槸鐪肩潧杩樻槸绗旓紝閮借兘鎵惧埌)
          const previewBtn = document.querySelector('.editor-toolbar .fa-eye') ||
            document.querySelector('.editor-toolbar .fa-pen');

          if (isPreview) {
            // A. 閫€鍑洪瑙?-> 鍙樺洖缂栬緫妯″紡
            container.classList.remove('preview-mode');
            editorTitle.disabled = false;

            // 馃攧 鍥炬爣鍙樺洖鈥滅溂鐫涒€?
            if (previewBtn) {
              previewBtn.classList.remove('fa-pen'); // 绉婚櫎绗?
              previewBtn.classList.add('fa-eye');    // 鍔犱笂鐪肩潧
              previewBtn.title = "棰勮";             // 鎻愮ず鏂囧瓧涔熻兘鏀?
            }

          } else {
            // B. 杩涘叆棰勮妯″紡
            container.classList.add('preview-mode');
            previewArea.innerHTML = marked.parse(editor.value() || '# 鏃犲唴瀹?);
            editorTitle.disabled = true;

            // 馃攧 鍥炬爣鍙樻垚鈥滅瑪鈥?(浠ｈ〃鍘荤紪杈?
            if (previewBtn) {
              previewBtn.classList.remove('fa-eye'); // 绉婚櫎鐪肩潧
              previewBtn.classList.add('fa-pen');    // 鍔犱笂绗?
              previewBtn.title = "杩斿洖缂栬緫";
            }
          }
        },
        className: "fa fa-eye", // 鍒濆鐘舵€佹槸鐪肩潧
        title: "棰勮"
      },
      "|",
      {
        name: "toggle-sidebar",
        action: function toggleSidebar(editor) {
          const sidebar = document.querySelector('.sidebar');
          const listView = document.querySelector('.list-view');
          sidebar.classList.toggle('collapsed');
          listView.classList.toggle('collapsed');

          // 鍒锋柊CodeMirror浠ラ€傚簲鏂板搴?
          setTimeout(() => {
            if (editor && editor.codemirror) {
              editor.codemirror.refresh();
            }
          }, 300);
        },
        className: "fa fa-bars",
        title: "鏀惰捣/灞曞紑渚ц竟鏍?
      }
    ],
    placeholder: "寮€濮嬭褰曚綘鐨勬兂娉?..",
    // 绂佺敤鍙兘瀵艰嚧鍐茬獊鐨勫揩鎹烽敭
    shortcuts: {
      toggleFullScreen: null,
      toggleSideBySide: null
    },
    // 鍏朵粬閰嶇疆
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: true,
    minHeight: "300px"
  });

  // 璁剧疆鎾ら攢寤惰繜
  easyMDE.codemirror.setOption("historyEventDelay", 200);

  // 銆愬叧閿唬鐮併€戞妸 EasyMDE 鐨勫伐鍏锋爮鎼埌鏈€涓婇潰鐨?.toolbar 閲?
  const easyMDEToolbar = document.querySelector('.editor-toolbar');
  const mainToolbar = document.querySelector('.toolbar');
  const rightTools = document.querySelector('.tool-right');

  if (easyMDEToolbar && mainToolbar && rightTools) {
    // 绉婚櫎 EasyMDE 榛樿鏍峰紡
    easyMDEToolbar.style.border = 'none';
    easyMDEToolbar.style.borderRadius = '0';
    easyMDEToolbar.style.backgroundColor = 'transparent';
    easyMDEToolbar.style.padding = '0';

    // 鎶婂伐鍏锋爮鎻掑叆鍒颁富宸ュ叿鏍忓乏渚?
    mainToolbar.insertBefore(easyMDEToolbar, rightTools);
  }

  // 淇 CodeMirror 楂樺害鑷€傚簲
  setTimeout(() => {
    if (easyMDE && easyMDE.codemirror) {
      easyMDE.codemirror.refresh();
    }
  }, 100);

  // ===========================================
  // 馃捑 鏁版嵁鍚屾閫昏緫 (淇鐗堬細闈欓粯淇濆瓨锛屼笉璺冲姩)
  // ===========================================
  easyMDE.codemirror.on("change", () => {
    // 馃敀 濡傛灉閿佹槸閿佺潃鐨勶紝璇存槑鏄郴缁熷湪鍔犺浇锛屼笉鏄汉鍦ㄦ墦瀛楋紝鐩存帴鏃犺
    if (isLoadingNote) return;

    const val = easyMDE.value();
    if (currentNoteId) {
      const note = notes.find(n => n.id == currentNoteId); // 鏁板瓧鍜屽瓧绗︿覆缁熶竴

      if (note) {
        // 鏇存柊鍐呭鍜屾椂闂?
        note.content = val;
        note.updateTime = Date.now();

        // 鍏抽敭淇敼锛氬彧淇濆瓨鏁版嵁锛屼笉閲嶇粯鍒楄〃锛?
        // renderNoteList();  
        // 杩欐牱浣犲湪鎵撳瓧鏃讹紝宸︿晶鍒楄〃灏变笉浼氬姩浜嗐€?

        saveAllToLocalStorage();

        // 鏍稿績淇锛氭墜鍔ㄦ洿鏂板乏渚у垪琛ㄧ殑 UI (涓嶉噸鎺?
        const noteItem = document.querySelector(`.note-item[data-id="${currentNoteId}"]`); // 鍋囪浣犵粰li鍔犱簡data-id
        // 濡傛灉浣犵殑 li 娌℃湁 data-id锛屽彲鑳介渶瑕佹敼 renderNoteList 缁欏畠鍔犱笂锛屾垨鑰呴€氳繃鍏朵粬鏂瑰紡鎵?

        // 杩欓噷鍋囪 renderNoteList 閲岀敓鎴愮殑 li 杩樻病鏈?data-id锛屾垜浠渶瑕佸幓 renderNoteList 鍔犱竴琛屼唬鐮侊紒
        // 鏆傛椂鍏堢敤杩欎竴鎷涳細
        // 灏濊瘯鎵惧埌褰撳墠 active 鐨?li (鍥犱负姝ｅ湪缂栬緫鐨勮偗瀹氭槸琚€変腑鐨?
        const activeItem = document.querySelector('.note-item.active');

        if (activeItem) {
          // A. 鏇存柊棰勮鏂囧瓧 (鎻愬彇鍓?0涓瓧)
          const previewDiv = activeItem.querySelector('.note-preview');
          if (previewDiv) {
            // 绠€鍗曠殑鍘婚櫎 Markdown 绗﹀彿閫昏緫
            const plainText = val.replace(/[#*`]/g, '').replace(/\n/g, ' ').substring(0, 50);
            // 濡傛灉鏈夋悳绱㈣瘝锛岃寰楅珮浜?杩欓噷绠€鍗曞鐞嗭紝鐩存帴鏄剧ず鏂囧瓧)
            previewDiv.textContent = plainText || '鏃犲唴瀹?;
          }

          // B. 鏇存柊鏃堕棿
          const dateDiv = activeItem.querySelector('.note-date');
          if (dateDiv) {
            dateDiv.textContent = '鍒氬垰';
          }
        }
      }
    }
  });

  // 鏀寔绮樿创鍥剧墖(Ctrl+V)
  easyMDE.codemirror.on("paste", function (editor, e) {
    if (!(e.clipboardData && e.clipboardData.items)) return;
    for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
      let item = e.clipboardData.items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        let blob = item.getAsFile();
        let reader = new FileReader();
        reader.onload = function (event) {
          let base64 = event.target.result;
          let markdownImage = `\n![绮樿创鐨勫浘鐗嘳(${base64})\n`;
          editor.replaceSelection(markdownImage);
          reader.onload = function (event) {
            let base64 = event.target.result;
            let markdownImage = `\n![绮樿创鐨勫浘鐗嘳(${base64})\n`;
            editor.replaceSelection(markdownImage);

            // 鏂板锛氱矘璐村畬鍥剧墖锛岀珛椹Е鍙戜竴娆′繚瀛橈紒
            // 鎵嬪姩瑙﹀彂 change 浜嬩欢锛岃涓婇潰鐨勫悓姝ラ€昏緫宸ヤ綔
            CodeMirror.signal(editor, "change", editor);
          };
        };
        reader.readAsDataURL(blob);
        return;
      }
    }
  });
}


const undoBtn = document.getElementById('undo-btn');

if (undoBtn) {
  undoBtn.addEventListener('click', () => {
    // 妫€鏌ョ紪杈戝櫒鏄惁宸插姞杞?
    if (easyMDE && easyMDE.codemirror) {
      // 璋冪敤 CodeMirror 搴曞眰鐨勬挙閿€鍔熻兘
      easyMDE.codemirror.undo();
      // 鑱氱劍鍥炵紪杈戝櫒
      easyMDE.codemirror.focus();
    }
  });
}

// F3. 绉佸瘑绗旇绯荤粺
/**
 * 澶勭悊绉佸瘑绗旇璁块棶楠岃瘉
 * @param {string} targetId - 鐩爣鍒嗙被ID
 * @param {string} targetName - 鐩爣鍒嗙被鍚嶇О
 * @description 棣栨璁块棶璁剧疆瀵嗙爜锛屽悗缁闂渶楠岃瘉瀵嗙爜
 */
function handlePrivateAccess(targetId, targetName) {
  // 1. 妫€鏌?LocalStorage 鏈夋棤瀛樿繃瀵嗙爜
  const savedPassword = localStorage.getItem('private_password');

  if (!savedPassword) {
    // a. 濡傛灉娌℃湁瀛樿繃 -> 绗竴娆′娇鐢紝鎻愮ず璁剧疆瀵嗙爜
    showModal('璁剧疆绉佸瘑瀵嗙爜', '璇疯缃?-10浣嶈闂瘑鐮?璇风墷璁?', (inputVal) => {
      if (!inputVal) {
        alert("瀵嗙爜涓嶈兘涓虹┖!");
        return;
      }

      // 鏂板锛氶暱搴﹂檺鍒?
      if (inputVal.length < 4 || inputVal.length > 10) {
        alert("瀵嗙爜闀垮害蹇呴』鍦?4 鍒?10 涔嬮棿");
        // 閲嶆柊寮圭獥璁╃敤鎴疯缃?绠€鍗曠矖鏆寸殑閲嶈瘯鏈哄埗)
        setTimeout(() => handlePrivateAccess(targetId, targetName), 100);
        return;
      }

      localStorage.setItem('private_password', inputVal);
      alert('瀵嗙爜璁剧疆鎴愬姛, 璇风墷璁?');
      switchCategory(targetId, targetName);
      /* if (inputVal) {
        localStorage.setItem('private_password', inputVal);
        switchCategory(targetId, targetName); // 璁剧疆瀹岀洿鎺ヨ繘鍏?
      } */
    });

  } else {
    // b. 濡傛灉瀛樿繃 -> 鎻愮ず杈撳叆瀵嗙爜闂
    showModal('绉佸瘑绗旇宸查攣瀹?, '璇疯緭鍏ュ瘑鐮佽В閿?, (inputVal) => {
      if (inputVal === savedPassword) {
        switchCategory(targetId, targetName);
      } else {
        alert('瀵嗙爜閿欒, 璇烽噸璇?');
      }
    });
  }
}

// ===========================================
// 馃幑 浣撻獙浼樺寲锛氭爣棰樻爮鎸夆€滀笅绠ご/鍥炶溅鈥濊烦鍒版鏂?
// ===========================================
const noteTitleInput = document.getElementById('note-title');

if (noteTitleInput) {
  noteTitleInput.addEventListener('keydown', (e) => {
    // 鐩戝惉 "ArrowDown"(涓嬬澶? 鍜?"Enter"(鍥炶溅)
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault(); // 闃绘榛樿琛屼负 (姣斿鍥炶溅涓嶇敤鐪熺殑鍦ㄦ爣棰橀噷鎹㈣)

      // 妫€鏌ョ紪杈戝櫒鏄惁瀛樺湪
      if (typeof easyMDE !== 'undefined' && easyMDE.codemirror) {
        easyMDE.codemirror.focus(); // 鏍稿績锛氳仛鐒﹀埌缂栬緫鍣?
        easyMDE.codemirror.setCursor(0, 0); // (鍙€? 鎶婂厜鏍囧畾鍦ㄦ鏂囧紑澶?
      }
    }
  });
}

// F4. 鍙抽敭鑿滃崟绯荤粺
// 鏂囦欢澶瑰彸閿彍鍗曪細閲嶅懡鍚嶅拰鍒犻櫎鍔熻兘
const ctxMenu = document.getElementById('folder-context-menu');
const ctxRenameBtn = document.getElementById('ctx-rename');
const ctxDeleteBtn = document.getElementById('ctx-delete');
let ctxTargetId = null; // 瀛樹竴涓嬪綋鍓嶅彸閿偣鐨勬槸鍝釜鏂囦欢澶?

// 1. 鏄剧ず鑿滃崟
function showContextMenu(e, categoryId) {
  ctxTargetId = categoryId;

  // 璁＄畻浣嶇疆 (闃叉鑿滃崟璺戝嚭灞忓箷锛岃繖閲岀畝鍗曡窡闅忛紶鏍?
  ctxMenu.style.left = `${e.pageX}px`;
  ctxMenu.style.top = `${e.pageY}px`;
  ctxMenu.style.display = 'block';
}

// 2. 闅愯棌鑿滃崟 (鐐瑰嚮椤甸潰浠讳綍鍏朵粬鍦版柟)
document.addEventListener('click', () => {
  if (ctxMenu) ctxMenu.style.display = 'none';
});

// 3. 缁戝畾鍔熻兘锛氶噸鍛藉悕
if (ctxRenameBtn) {
  ctxRenameBtn.addEventListener('click', () => {
    if (!ctxTargetId) return;

    const category = categories.find(c => c.id === ctxTargetId);
    if (!category) return;

    // 澶嶇敤浣犵殑婕備寒寮圭獥
    showModal('閲嶅懡鍚嶆枃浠跺す', '璇疯緭鍏ユ柊鍚嶇О', (newName) => {
      if (newName === category.name) return; // 娌″彉灏变笉鍔?

      category.name = newName;
      saveAllToLocalStorage();
      renderFolderList(); // 鍒锋柊鍒楄〃鍚嶅瓧

      // 濡傛灉褰撳墠姝ｉ€夌潃杩欎釜鏂囦欢澶癸紝鏍囬涔熻鍙?
      if (currentCategoryId === ctxTargetId) {
        listTitleEl.textContent = newName;
      }
    });

    // 灏忔妧宸э細寮圭獥鍑烘潵鍚庯紝鎶婃棫鍚嶅瓧濉繘鍘伙紝鏂逛究淇敼
    setTimeout(() => {
      if (modalInput) {
        modalInput.value = category.name;
        modalInput.select(); // 鑷姩鍏ㄩ€夋枃瀛?
      }
    }, 50); // 绋嶅井寤惰繜涓€鐐圭偣绛夊脊绐楁覆鏌?
  });
}

// 4. 缁戝畾鍔熻兘锛氬垹闄?
if (ctxDeleteBtn) {
  ctxDeleteBtn.addEventListener('click', () => {
    if (!ctxTargetId) return;

    const category = categories.find(c => c.id === ctxTargetId);
    if (category) {
      handleDeleteFolder(category); // 璋冪敤浣犲師鏉ョ殑鍒犻櫎鍑芥暟
    }
  });
}

// E3. 閲嶇疆缂栬緫鍣?
/**
 * 寮哄姏娓呯┖缂栬緫鍣ㄦ墍鏈夊唴瀹?
 * @description 鍒犻櫎绗旇鍚庤皟鐢紝娓呴櫎鏍囬銆佸唴瀹广€侀瑙堝尯鍩熴€佺姸鎬?
 */
function resetEditor() {
  // 1. 閫€鍑洪瑙堟ā寮?
  const container = document.querySelector('.editor-container');
  const previewArea = document.getElementById('note-preview-area');
  if (container) container.classList.remove('preview-mode');
  if (previewArea) previewArea.innerHTML = ''; // 娓呯┖棰勮HTML

  // 2. 娓呯┖杈撳叆妗?
  editorTitle.value = '';
  editorContent.value = '';
  editorTitle.disabled = false; // 鎭㈠鍙紪杈?

  // 3. 娓呯┖ EasyMDE (鏍稿績)
  if (easyMDE) {
    easyMDE.value("");
    // 淇锛氭湁浜涙椂鍊?clear 涔嬪悗 placeholder 涓嶆樉绀猴紝寮哄埗鍒锋柊涓€涓?
    setTimeout(() => {
      if (easyMDE.codemirror) easyMDE.codemirror.refresh();
    }, 10);
  }

  // 4. 鍥炬爣鎭㈠涓衡€滈瑙堚€?(鐪肩潧)
  const previewBtn = document.querySelector('.editor-toolbar .fa-pen');
  if (previewBtn) {
    previewBtn.classList.remove('fa-pen');
    previewBtn.classList.add('fa-eye');
    previewBtn.title = "棰勮";
  }

  // 5. 鐘舵€佺疆绌?
  currentNoteId = null;
}

// ============================================
// 馃帀 鏍稿績鑴氭湰鍔犺浇瀹屾垚
// ============================================
// 妯″潡鍒掑垎锛欰.鏁版嵁灞?| B.宸ュ叿鍑芥暟 | C.娓叉煋灞?| D.浜嬩欢澶勭悊 | E.缂栬緫鍣?| F.楂樼骇鍔熻兘
// 鎵€鏈夊姛鑳藉凡鎸夋ā鍧楃粍缁囷紝渚夸簬缁存姢鍜屾墿灞?
// ============================================


// ============================================
// MODULE E: EDITOR INTEGRATION 馃摑 (缂栬緫鍣ㄩ泦鎴?
// ============================================
// EasyMDE Markdown缂栬緫鍣ㄧ殑鍒濆鍖栥€侀厤缃€佷簨浠跺鐞?
// ============================================

// E2. 鍔犺浇绗旇鍒扮紪杈戝櫒
/**
 * 鍔犺浇绗旇鍐呭鍒扮紪杈戝櫒
 * @param {Object} note - 绗旇瀵硅薄
 * @description 馃敀 浣跨敤鍔犺浇閿侀槻姝㈣Е鍙戣嚜鍔ㄤ繚瀛樹簨浠?
 */
function loadNoteToEditor(note) {
  // 1. 涓婇攣锛氬憡璇夌郴缁?姝ｅ湪鍔犺浇锛屼笉鏄敤鎴峰湪鎵撳瓧"
  isLoadingNote = true;

  currentNoteId = note.id;

  // 鏇存柊鏍囬杈撳叆妗?
  editorTitle.value = note.title;

  // 鏇存柊缂栬緫鍣ㄥ唴瀹?
  if (easyMDE) {
    easyMDE.value(note.content || "");

    // 鈴?寤惰繜瑙ｉ攣锛氱瓑缂栬緫鍣ㄦ覆鏌撳畬浜嗭紝鍐嶆妸閿佹墦寮€
    // (杩欐槸涓轰簡闃叉 easyMDE 璁剧疆鍊兼椂鐬棿瑙﹀彂 change 浜嬩欢)
    setTimeout(() => {
      isLoadingNote = false;
    }, 200);
  }

  // 绉诲姩绔€昏緫 (淇濇寔涓嶅彉)
  const container = document.querySelector('.editor-container');
  container.classList.remove('preview-mode');
  editorTitle.disabled = false;
}

// E3. 鍐呭瀹炴椂淇濆瓨鐩戝惉
// 鐩戝惉鏍囬鍜屽唴瀹圭殑杈撳叆鍙樺寲锛岃嚜鍔ㄤ繚瀛?
[editorTitle, editorContent].forEach(input => {
  input.addEventListener('input', () => {
    // 濡傛灉娌℃湁閫変腑绗旇锛屼笉鍏佽缂栬緫
    if (!currentNoteId) return;

    // 鑾峰彇褰撳墠缂栬緫鐨勭瑪璁板璞?
    const currentNote = notes.find(n => n.id === currentNoteId);

    if (currentNote) {
      // 鏇存柊鏁版嵁
      currentNote.title = editorTitle.value;
      currentNote.content = editorContent.value;
      currentNote.updateTime = Date.now(); // 瀛樻椂闂存埑

      // 淇濆瓨鏁版嵁鍒?LocalStorage
      saveAllToLocalStorage();
      // 閲嶆柊娓叉煋绗旇鍒楄〃锛屾洿鏂伴瑙堝拰鏃堕棿
      renderNoteList();

      // 閲嶇粯鍚庣劍鐐瑰彲鑳戒細涓㈠け锛岀畝鍗曞鐞嗭細淇濇寔 focus 鐘舵€?(娴忚鍣ㄩ粯璁よ涓洪€氬父鑳戒繚鎸?
      // 濡傛灉鍙戠幇杈撳叆鍗￠】鎴栫劍鐐逛涪澶憋紝鍙互浼樺寲杩欓噷鐨勯€昏緫
    }
  });
});

// ============================================
// MODULE F: ADVANCED FEATURES 鉁?(楂樼骇鍔熻兘)
// ============================================
// 涓婚鍒囨崲銆佸脊绐楃郴缁熴€佸彸閿彍鍗曘€佺瀵嗙瑪璁扮瓑楂樼骇鐗规€?
// ============================================

// F1. 鑷畾涔夊脊绐楃郴缁?
// 鏀寔杈撳叆妗嗘ā寮忓拰纭妯″紡鐨勯€氱敤寮圭獥
const modalOverlay = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc'); // 鏂板
const modalInput = document.getElementById('modal-input');
const modalConfirmBtn = document.getElementById('modal-confirm');
const modalCancelBtn = document.getElementById('modal-cancel');

let onModalConfirm = null;
let isInputMode = true; // 鏍囪褰撳墠鏄緭鍏ユā寮忚繕鏄函纭妯″紡

/**
 * 鏄剧ず杈撳叆妗嗗脊绐?
 * @param {string} title - 寮圭獥鏍囬
 * @param {string} placeholder - 杈撳叆妗嗘彁绀烘枃瀛?
 * @param {Function} callback - 纭鍚庣殑鍥炶皟鍑芥暟锛屾帴鏀惰緭鍏ュ€间綔涓哄弬鏁?
 */
function showModal(title, placeholder, callback) {
  isInputMode = true;
  modalTitle.textContent = title;

  // UI 鍒囨崲锛氭樉绀鸿緭鍏ユ锛岄殣钘忔枃鏈?
  modalInput.style.display = 'block';
  modalDesc.style.display = 'none';

  modalInput.placeholder = placeholder;
  modalInput.value = '';

  // 瀵嗙爜妗嗗鐞?
  if (title.includes('瀵嗙爜') || title.includes('閿佸畾')) {
    modalInput.type = 'password';
  } else {
    modalInput.type = 'text';
  }

  modalOverlay.style.display = 'flex';
  setTimeout(() => modalInput.focus(), 50); // 寤惰繜鑱氱劍闃叉姈
  onModalConfirm = callback;
}

/**
 * 鏄剧ず纭寮圭獥
 * @param {string} title - 寮圭獥鏍囬
 * @param {string} message - 纭娑堟伅鏂囨湰
 * @param {Function} callback - 纭鍚庣殑鍥炶皟鍑芥暟
 */
function showConfirm(title, message, callback) {
  isInputMode = false;
  modalTitle.textContent = title;

  // UI 鍒囨崲锛氶殣钘忚緭鍏ユ锛屾樉绀烘枃鏈?
  modalInput.style.display = 'none';
  modalDesc.style.display = 'block';
  modalDesc.textContent = message;

  modalOverlay.style.display = 'flex';
  onModalConfirm = callback;
}

// 闅愯棌寮圭獥
function hideModal() {
  modalOverlay.style.display = 'none';
  onModalConfirm = null;
}

// 缁戝畾鎸夐挳浜嬩欢
if (modalCancelBtn) modalCancelBtn.onclick = hideModal;

if (modalConfirmBtn) {
  modalConfirmBtn.onclick = () => {
    if (isInputMode) {
      // A. 杈撳叆妯″紡锛氬繀椤绘湁鍊?
      const value = modalInput.value.trim();
      if (value) {
        if (onModalConfirm) onModalConfirm(value);
        hideModal();
      } else {
        alert("鍐呭涓嶈兘涓虹┖");
      }
    } else {
      // B. 纭妯″紡锛氱洿鎺ユ墽琛?
      if (onModalConfirm) onModalConfirm();
      hideModal();
