(function () {
  'use strict';

  // Date display
  var now = new Date();
  var opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  document.getElementById('headerDate').textContent = now.toLocaleDateString('ja-JP', opts);

  var todayEl = document.getElementById('todayDate');
  if (todayEl) {
    todayEl.textContent = now.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' });
  }

  // Tab switching (announcements)
  var tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
})();
