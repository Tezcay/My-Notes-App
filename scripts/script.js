// 选中所有左侧导航项
const navItem = document.querySelectorAll('.nav-item');

// 为每个导航项添加点击事件监听器
navItem.forEach(item => {
  item.addEventListener('click', () => {
    // 移除所有导航项的 'active' 类
    navItem.forEach(i => i.classList.remove('active'));

    // 为当前点击的导航项添加 'active' 类
    item.classList.add('active');
  });
});