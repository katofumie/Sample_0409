/**
 * 全社ダッシュボード - メインスクリプト
 */
(function () {
  'use strict';

  // ===== Chart.js グローバル設定 =====
  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#64748b';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;

  const MONTHS = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
  const COLORS = {
    primary: '#3b82f6',
    primaryLight: 'rgba(59, 130, 246, 0.1)',
    success: '#10b981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    warning: '#f59e0b',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    danger: '#ef4444',
    dangerLight: 'rgba(239, 68, 68, 0.1)',
    info: '#6366f1',
    gray: '#94a3b8',
    grayLight: 'rgba(148, 163, 184, 0.1)',
  };

  // Chart instances store
  const charts = {};

  // ===== Navigation =====
  function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var sectionId = this.getAttribute('data-section');

        navItems.forEach(function (n) { n.classList.remove('active'); });
        this.classList.add('active');

        sections.forEach(function (s) { s.classList.remove('active'); });
        var target = document.getElementById('section-' + sectionId);
        if (target) {
          target.classList.add('active');
          animateKPIs(target);
          initSectionCharts(sectionId);
        }

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
        var overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.classList.remove('active');
      }.bind(item));
    });
  }

  // ===== Sidebar Toggle (Mobile) =====
  function initSidebarToggle() {
    var toggle = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('sidebar');

    // Create overlay
    var overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', function () {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // ===== KPI Number Animation =====
  function animateKPIs(container) {
    var kpiValues = container.querySelectorAll('.kpi-value');
    kpiValues.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target'));
      var decimals = parseInt(el.getAttribute('data-decimals')) || 0;
      var duration = 800;
      var start = performance.now();

      function update(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        // ease out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = target * eased;

        if (decimals > 0) {
          el.textContent = current.toFixed(decimals);
        } else {
          el.textContent = Math.round(current).toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          if (decimals > 0) {
            el.textContent = target.toFixed(decimals);
          } else {
            el.textContent = target.toLocaleString();
          }
        }
      }

      requestAnimationFrame(update);
    });
  }

  // ===== Header Date & Live Clock =====
  function setHeaderDate() {
    var now = new Date();
    var opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    document.getElementById('headerDate').textContent = now.toLocaleDateString('ja-JP', opts);
    updateClock();
    setInterval(updateClock, 1000);
  }

  function updateClock() {
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, '0');
    var mins = String(now.getMinutes()).padStart(2, '0');
    var secs = String(now.getSeconds()).padStart(2, '0');
    var clockEl = document.getElementById('headerClock');
    if (clockEl) clockEl.textContent = hours + ':' + mins + ':' + secs;
    var updateEl = document.getElementById('lastUpdate');
    if (updateEl) updateEl.textContent = hours + ':' + mins;
  }

  // ===== Notification Dropdown =====
  function initNotification() {
    var btn = document.getElementById('notificationBtn');
    var dropdown = document.getElementById('notificationDropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
    });

    dropdown.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  // ===== Chart Helpers =====
  function createChart(canvasId, config) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // Destroy existing
    if (charts[canvasId]) {
      charts[canvasId].destroy();
    }

    // Chart.js requires a fixed-height parent container to constrain canvas size
    if (!canvas.parentElement.classList.contains('chart-container')) {
      var wrapper = document.createElement('div');
      wrapper.className = 'chart-container';
      canvas.parentElement.insertBefore(wrapper, canvas);
      wrapper.appendChild(canvas);
    }

    charts[canvasId] = new Chart(canvas, config);
    return charts[canvasId];
  }

  // ===== Section Chart Initializers =====
  var chartInitialized = {};

  function initSectionCharts(sectionId) {
    if (chartInitialized[sectionId]) return;
    chartInitialized[sectionId] = true;

    var initializers = {
      executive: initExecutiveCharts,
      projects: initProjectCharts,
      safety: initSafetyCharts,
      personnel: initPersonnelCharts,
      finance: initFinanceCharts,
      sales: initSalesCharts,
      analysis: initAnalysisCharts,
      environment: initEnvironmentCharts,
    };

    if (initializers[sectionId]) {
      initializers[sectionId]();
    }
  }

  // ----- 1. 経営サマリー -----
  function initExecutiveCharts() {
    // 受注高・完工高 月次推移
    createChart('chart-revenue-trend', {
      type: 'bar',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: '受注高',
            data: [78, 87, 69, 110, 77, 90, 115, 81, 98, 75, 84, 116],
            backgroundColor: COLORS.primary,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.7,
          },
          {
            label: '完工高',
            data: [62, 55, 67, 59, 66, 79, 70, 87, 76, 63, 81, 87],
            backgroundColor: COLORS.success,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.7,
          },
          {
            label: '受注高（前年）',
            type: 'line',
            data: [73, 79, 65, 98, 70, 84, 107, 76, 90, 69, 79, 107],
            borderColor: COLORS.gray,
            borderDash: [5, 5],
            pointRadius: 0,
            tension: 0.3,
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y + '億円'; },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function (v) { return v + '億'; } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: { grid: { display: false } },
        },
      },
    });

    // 部門別売上構成
    createChart('chart-department', {
      type: 'doughnut',
      data: {
        labels: ['建築事業', '土木事業', '設計事業', '不動産事業', 'その他'],
        datasets: [{
          data: [45, 30, 10, 8, 7],
          backgroundColor: [COLORS.primary, COLORS.success, COLORS.warning, COLORS.info, COLORS.gray],
          borderWidth: 0,
          spacing: 2,
        }],
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.label + ': ' + ctx.parsed + '%'; },
            },
          },
        },
      },
    });
  }

  // ----- 2. プロジェクト管理 -----
  function initProjectCharts() {
    // プロジェクト状況
    createChart('chart-project-status', {
      type: 'doughnut',
      data: {
        labels: ['順調', '注意', '遅延'],
        datasets: [{
          data: [18, 3, 2],
          backgroundColor: [COLORS.success, COLORS.warning, COLORS.danger],
          borderWidth: 0,
          spacing: 2,
        }],
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });

    // 主要プロジェクト 工程進捗 (horizontal bar)
    createChart('chart-project-progress', {
      type: 'bar',
      data: {
        labels: ['虎ノ門タワー', '横浜MM再開発', '首都高速更新', '新宿南口駅ビル', '東京湾岸トンネル', '大阪梅田複合'],
        datasets: [
          {
            label: '実績',
            data: [62, 45, 78, 33, 91, 55],
            backgroundColor: function (ctx) {
              var v = ctx.parsed.x;
              if (v < 40) return COLORS.danger;
              if (v < 60) return COLORS.warning;
              return COLORS.primary;
            },
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: '計画',
            data: [65, 50, 76, 45, 90, 54],
            backgroundColor: 'rgba(148, 163, 184, 0.3)',
            borderRadius: 4,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.dataset.label + ': ' + ctx.parsed.x + '%'; },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: function (v) { return v + '%'; } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          y: { grid: { display: false } },
        },
      },
    });
  }

  // ----- 3. 安全・品質管理 -----
  function initSafetyCharts() {
    // 災害発生件数
    createChart('chart-incidents', {
      type: 'bar',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: '不休災害',
            data: [1, 0, 2, 1, 0, 1, 0, 1, 0, 0, 1, 0],
            backgroundColor: COLORS.warning,
            borderRadius: 4,
          },
          {
            label: '休業災害',
            data: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: COLORS.danger,
            borderRadius: 4,
          },
          {
            label: '度数率',
            type: 'line',
            data: [0.58, 0.55, 0.52, 0.54, 0.51, 0.49, 0.48, 0.47, 0.46, 0.45, 0.43, 0.42],
            borderColor: COLORS.primary,
            yAxisID: 'y1',
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: '件数' },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            title: { display: true, text: '度数率' },
            grid: { display: false },
          },
          x: { grid: { display: false } },
        },
      },
    });

    // 品質検査 合格率
    createChart('chart-quality', {
      type: 'radar',
      data: {
        labels: ['コンクリート', '鉄筋', '鉄骨', '防水', '仕上げ', '設備'],
        datasets: [
          {
            label: '今期',
            data: [98.2, 97.5, 99.1, 96.8, 97.3, 98.0],
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primaryLight,
            pointRadius: 4,
            borderWidth: 2,
          },
          {
            label: '前期',
            data: [97.0, 96.8, 98.5, 95.2, 96.5, 97.1],
            borderColor: COLORS.gray,
            backgroundColor: COLORS.grayLight,
            pointRadius: 4,
            borderWidth: 2,
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        scales: {
          r: {
            beginAtZero: false,
            min: 92,
            max: 100,
            ticks: { callback: function (v) { return v + '%'; }, stepSize: 2 },
          },
        },
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  // ----- 4. 人員・リソース -----
  function initPersonnelCharts() {
    // 部門別 人員配置
    createChart('chart-staff-allocation', {
      type: 'bar',
      data: {
        labels: ['建築事業部', '土木事業部', '設計部', '営業部', '管理部門', '技術研究所'],
        datasets: [
          {
            label: '現場配置',
            data: [118, 87, 24, 0, 0, 0],
            backgroundColor: COLORS.primary,
            borderRadius: 4,
          },
          {
            label: '内勤',
            data: [19, 12, 18, 27, 31, 14],
            backgroundColor: COLORS.info,
            borderRadius: 4,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            stacked: true,
            ticks: { callback: function (v) { return v + '名'; } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: { stacked: true, grid: { display: false } },
        },
      },
    });

    // 部門別 月平均残業時間
    createChart('chart-overtime', {
      type: 'bar',
      data: {
        labels: ['建築', '土木', '設計', '営業', '管理', '研究所'],
        datasets: [{
          label: '月平均残業時間',
          data: [34.2, 31.5, 26.8, 22.3, 18.4, 24.1],
          backgroundColor: function (ctx) {
            var v = ctx.parsed.y;
            if (v > 30) return COLORS.danger;
            if (v > 25) return COLORS.warning;
            return COLORS.success;
          },
          borderRadius: 4,
        }],
      },
      options: {
        plugins: {
          legend: { display: false },
          annotation: {},
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function (v) { return v + 'h'; } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // ----- 5. 財務・資金管理 -----
  function initFinanceCharts() {
    // 月次キャッシュフロー
    createChart('chart-cashflow', {
      type: 'bar',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: '営業CF',
            data: [9, 8, 12, 6, 10, 8, 11, 7, 9, 5, 7, 10],
            backgroundColor: COLORS.primary,
            borderRadius: 4,
          },
          {
            label: '投資CF',
            data: [-4, -3, -5, -3, -4, -2, -6, -3, -5, -3, -4, -5],
            backgroundColor: COLORS.warning,
            borderRadius: 4,
          },
          {
            label: '累計FCF',
            type: 'line',
            data: [5, 10, 17, 20, 26, 32, 37, 41, 45, 47, 50, 55],
            borderColor: COLORS.success,
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            ticks: { callback: function (v) { return v + '億'; } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: { grid: { display: false } },
        },
      },
    });

    // 債権回収状況
    createChart('chart-receivables', {
      type: 'doughnut',
      data: {
        labels: ['30日以内', '31-60日', '61-90日', '90日超'],
        datasets: [{
          data: [68, 18, 9, 5],
          backgroundColor: [COLORS.success, COLORS.primary, COLORS.warning, COLORS.danger],
          borderWidth: 0,
          spacing: 2,
        }],
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.label + ': ' + ctx.parsed + '%'; },
            },
          },
        },
      },
    });

    // 部門別損益
    createChart('chart-dept-pnl', {
      type: 'bar',
      data: {
        labels: ['建築事業', '土木事業', '設計事業', '不動産事業'],
        datasets: [
          {
            label: '売上高',
            data: [360, 240, 80, 64],
            backgroundColor: COLORS.primary,
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: '営業利益',
            data: [25, 17, 8, 8],
            backgroundColor: COLORS.success,
            borderRadius: 4,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function (v) { return v + '億'; } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: { grid: { display: false } },
        },
      },
    });

    // 外注費・資材費 推移
    createChart('chart-cost-trend', {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: '外注費',
            data: [40, 39, 44, 42, 45, 46, 44, 48, 46, 44, 47, 48],
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primaryLight,
            fill: true,
            tension: 0.3,
            borderWidth: 2,
          },
          {
            label: '資材費',
            data: [25, 26, 27, 28, 28, 30, 29, 30, 31, 30, 31, 32],
            borderColor: COLORS.warning,
            backgroundColor: COLORS.warningLight,
            fill: true,
            tension: 0.3,
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { callback: function (v) { return v + '億'; } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // ----- 6. 営業・受注管理 -----
  function initSalesCharts() {
    // 案件パイプライン (horizontal funnel-like bar)
    createChart('chart-pipeline', {
      type: 'bar',
      data: {
        labels: ['情報収集', '提案中', '見積提出', '交渉中', '内定'],
        datasets: [{
          label: '金額（億円）',
          data: [900, 530, 660, 320, 250],
          backgroundColor: [
            'rgba(99, 102, 241, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(239, 68, 68, 0.6)',
          ],
          borderRadius: 4,
          barPercentage: 0.5,
        }],
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.x + '億円'; },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: function (v) { return v + '億'; } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          y: { grid: { display: false } },
        },
      },
    });

    // 月次 受注実績推移
    createChart('chart-order-trend', {
      type: 'bar',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: '受注実績',
            data: [34, 24, 44, 26, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: COLORS.primary,
            borderRadius: 4,
          },
          {
            label: '受注計画',
            type: 'line',
            data: [37, 31, 39, 34, 42, 37, 45, 39, 48, 42, 39, 45],
            borderColor: COLORS.gray,
            borderDash: [5, 5],
            pointRadius: 3,
            tension: 0.3,
            borderWidth: 2,
          },
          {
            label: '累計実績',
            type: 'line',
            data: [34, 58, 102, 128, null, null, null, null, null, null, null, null],
            borderColor: COLORS.success,
            pointRadius: 4,
            tension: 0.3,
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function (v) { return v + '億'; } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // ----- 7. 環境・ESG -----
  function initEnvironmentCharts() {
    // CO2排出量 月次推移
    createChart('chart-co2', {
      type: 'bar',
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: '今期',
            data: [1.2, 1.1, 1.0, 0.9, 1.1, 1.2, 1.0, 0.9, 1.0, 1.1, 0.9, 1.0],
            backgroundColor: COLORS.primary,
            borderRadius: 4,
          },
          {
            label: '前期',
            data: [1.4, 1.3, 1.2, 1.1, 1.3, 1.4, 1.2, 1.1, 1.2, 1.3, 1.1, 1.2],
            backgroundColor: 'rgba(148, 163, 184, 0.4)',
            borderRadius: 4,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: '万t-CO2' },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          x: { grid: { display: false } },
        },
      },
    });

    // 廃棄物内訳
    createChart('chart-waste', {
      type: 'doughnut',
      data: {
        labels: ['コンクリート', '金属くず', '木くず', '汚泥', '混合廃棄物', 'その他'],
        datasets: [{
          data: [35, 22, 15, 12, 10, 6],
          backgroundColor: [
            COLORS.primary,
            COLORS.success,
            COLORS.warning,
            COLORS.info,
            COLORS.danger,
            COLORS.gray,
          ],
          borderWidth: 0,
          spacing: 2,
        }],
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.label + ': ' + ctx.parsed + '%'; },
            },
          },
        },
      },
    });
  }

  // ----- 実績分析 -----
  function initAnalysisCharts() {
    // エリア別 売上高推移（3年比較）
    createChart('chart-area-trend', {
      type: 'bar',
      data: {
        labels: ['東京', '大阪', '名古屋', '福岡', 'その他'],
        datasets: [
          { label: '2024', data: [298, 178, 116, 58, 61], backgroundColor: 'rgba(148,163,184,0.4)', borderRadius: 4, barPercentage: 0.7 },
          { label: '2025', data: [320, 191, 124, 67, 61], backgroundColor: 'rgba(59,130,246,0.4)', borderRadius: 4, barPercentage: 0.7 },
          { label: '2026', data: [340, 200, 128, 72, 60], backgroundColor: COLORS.primary, borderRadius: 4, barPercentage: 0.7 },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: function(c){return c.dataset.label+': '+c.parsed.y+'億円';} } } },
        scales: { y: { beginAtZero: true, ticks: { callback: function(v){return v+'億';} }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } },
      },
    });

    createChart('chart-area-pie', {
      type: 'doughnut',
      data: {
        labels: ['東京', '大阪', '名古屋', '福岡', 'その他'],
        datasets: [{ data: [42.5, 25, 16, 9, 7.5], backgroundColor: [COLORS.primary, COLORS.success, COLORS.warning, COLORS.info, COLORS.gray], borderWidth: 0, spacing: 2 }],
      },
      options: { cutout: '62%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function(c){return c.label+': '+c.parsed+'%';} } } } },
    });

    // 用途別
    createChart('chart-usage-bar', {
      type: 'bar',
      data: {
        labels: ['オフィスビル', 'マンション', '商業施設', '工場・倉庫', '公共施設', 'インフラ', 'その他'],
        datasets: [{
          label: '売上高（億円）',
          data: [224, 168, 120, 104, 96, 56, 32],
          backgroundColor: [COLORS.primary, '#60a5fa', COLORS.success, COLORS.warning, COLORS.info, '#a78bfa', COLORS.gray],
          borderRadius: 4, barPercentage: 0.55,
        }],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c){return c.parsed.x+'億円';} } } },
        scales: { x: { beginAtZero: true, ticks: { callback: function(v){return v+'億';} }, grid: { color: 'rgba(0,0,0,0.04)' } }, y: { grid: { display: false } } },
      },
    });

    createChart('chart-usage-pie', {
      type: 'doughnut',
      data: {
        labels: ['オフィスビル', 'マンション', '商業施設', '工場・倉庫', '公共施設', 'インフラ', 'その他'],
        datasets: [{ data: [28, 21, 15, 13, 12, 7, 4], backgroundColor: [COLORS.primary, '#60a5fa', COLORS.success, COLORS.warning, COLORS.info, '#a78bfa', COLORS.gray], borderWidth: 0, spacing: 2 }],
      },
      options: { cutout: '62%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function(c){return c.label+': '+c.parsed+'%';} } } } },
    });

    // 発注者別 推移
    createChart('chart-client-trend', {
      type: 'bar',
      data: {
        labels: ['デベロッパー', '官公庁', '一般企業', '鉄道・インフラ', '個人・その他'],
        datasets: [
          { label: '2024', data: [220, 163, 138, 92, 98], backgroundColor: 'rgba(148,163,184,0.4)', borderRadius: 4, barPercentage: 0.7 },
          { label: '2025', data: [238, 170, 145, 98, 110], backgroundColor: 'rgba(59,130,246,0.4)', borderRadius: 4, barPercentage: 0.7 },
          { label: '2026', data: [256, 176, 152, 104, 112], backgroundColor: COLORS.primary, borderRadius: 4, barPercentage: 0.7 },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: function(c){return c.dataset.label+': '+c.parsed.y+'億円';} } } },
        scales: { y: { beginAtZero: true, ticks: { callback: function(v){return v+'億';} }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } },
      },
    });

    createChart('chart-client-pie', {
      type: 'doughnut',
      data: {
        labels: ['デベロッパー', '官公庁', '一般企業', '鉄道・インフラ', '個人・その他'],
        datasets: [{ data: [32, 22, 19, 13, 14], backgroundColor: [COLORS.primary, COLORS.success, COLORS.warning, COLORS.info, COLORS.gray], borderWidth: 0, spacing: 2 }],
      },
      options: { cutout: '62%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function(c){return c.label+': '+c.parsed+'%';} } } } },
    });
  }

  // ===== Sub-tab switching =====
  function initSubTabs() {
    var tabs = document.querySelectorAll('.sub-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var parent = this.closest('.section');
        parent.querySelectorAll('.sub-tab').forEach(function(t){ t.classList.remove('active'); });
        this.classList.add('active');

        var targetId = 'subtab-' + this.getAttribute('data-subtab');
        parent.querySelectorAll('.subtab-content').forEach(function(c){ c.classList.remove('active'); });
        var target = document.getElementById(targetId);
        if (target) {
          target.classList.add('active');
          animateKPIs(target);
        }
      });
    });
  }

  // ===== Initialize =====
  function init() {
    setHeaderDate();
    initNavigation();
    initSidebarToggle();
    initNotification();
    initDrilldown();
    initSubTabs();

    // Initialize first section
    var activeSection = document.querySelector('.section.active');
    if (activeSection) {
      animateKPIs(activeSection);
    }
    initSectionCharts('executive');
  }

  // ===== Drilldown Modal =====
  function initDrilldown() {
    var kpiCard = document.getElementById('kpi-revenue');
    var overlay = document.getElementById('modalOverlay');
    var closeBtn = document.getElementById('modalClose');
    if (!kpiCard || !overlay) return;

    var drillChartCreated = false;

    kpiCard.addEventListener('click', function () {
      overlay.classList.add('open');
      if (!drillChartCreated) {
        drillChartCreated = true;
        initDrilldownChart();
      }
    });

    closeBtn.addEventListener('click', function () {
      overlay.classList.remove('open');
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.classList.remove('open');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') overlay.classList.remove('open');
    });
  }

  function initDrilldownChart() {
    var canvas = document.getElementById('chart-revenue-drill');
    if (!canvas) return;

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['2022', '2023', '2024', '2025', '2026（見込）'],
        datasets: [
          {
            label: '売上高（億円）',
            data: [674, 706, 731, 761, 800],
            backgroundColor: [
              'rgba(59, 130, 246, 0.5)',
              'rgba(59, 130, 246, 0.5)',
              'rgba(59, 130, 246, 0.5)',
              'rgba(59, 130, 246, 0.5)',
              'rgba(29, 78, 216, 0.8)',
            ],
            borderRadius: 6,
            barPercentage: 0.55,
            yAxisID: 'y',
          },
          {
            label: '営業利益率（%）',
            type: 'line',
            data: [5.8, 6.1, 6.2, 6.8, 7.0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: '#10b981',
            borderWidth: 2.5,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                if (ctx.datasetIndex === 0) return '売上高: ' + ctx.parsed.y.toLocaleString() + '億円';
                return '営業利益率: ' + ctx.parsed.y + '%';
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 500,
            title: { display: true, text: '売上高（億円）' },
            ticks: { callback: function (v) { return v.toLocaleString(); } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          y1: {
            position: 'right',
            min: 4,
            max: 9,
            title: { display: true, text: '営業利益率（%）' },
            ticks: { callback: function (v) { return v + '%'; } },
            grid: { display: false },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
