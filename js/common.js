/* 京师学林 · 公共脚本：页眉页脚、卡片渲染、图表主题 */
(function () {
  const PALETTE = {
    "汉语言文字学": "#c92820",
    "文献学": "#8a6d3b",
    "中国古代文学": "#2f6fb0",
    "中国现当代文学": "#b5533c",
    "比较文学与世界文学": "#1f8a66",
    "文艺学": "#8b7bb0",
    "民俗学": "#c9a227",
    "语言学及应用语言学": "#4f7a80",
    "其他": "#7a7f77",
  };
  const FALLBACK = ["#c92820", "#2f6fb0", "#1f8a66", "#8b7bb0", "#c9a227", "#b5533c", "#4f7a80"];

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // 颜色加深/变浅，用于头像渐变
  function shade(hex, amt) {
    const n = parseInt(hex.replace("#", ""), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v + amt)));
    return "#" + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)]
      .map(v => v.toString(16).padStart(2, "0")).join("");
  }

  const NAV = [
    ["index.html", "学者名录"],
    ["lineage.html", "师承世表"],
    ["masters.html", "先贤名师"],
    ["timeline.html", "学科时间线"],
    ["map.html", "学人地图"],
    ["build-guide.html", "构建方法"],
    ["data-sources.html", "数据来源"],
    ["taxonomy.html", "分类依据"],
  ];

  const BNU = {
    disciplineColor(discipline) {
      if (!discipline) return "#9aa0a6";
      return PALETTE[discipline] || FALLBACK[hashStr(discipline) % FALLBACK.length];
    },
    esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },
    demoBadge(s) {
      return s.demo ? '<span class="badge-demo">示例数据</span>' : "";
    },
    // 该学者的师承边数（由页面在渲染前注入 window.__REL_COUNT__）
    relBadge(s) {
      const n = (window.__REL_COUNT__ || {})[s.id] || 0;
      return n ? `<span class="badge-rel" title="师承关系 ${n} 条">师承 ${n}</span>` : "";
    },
    scholarCard(s) {
      const color = BNU.disciplineColor(s.discipline);
      const chips = (s.interests || []).slice(0, 3)
        .map(t => `<span class="tag" title="${BNU.esc(t)}">${BNU.esc(t)}</span>`).join("");
      const meta = [s.title, s.discipline, s.org].filter(Boolean).map(BNU.esc).join(" · ");
      return `
        <div class="scholar-card" style="--card-accent:${color}">
          <div class="head">
            <div class="avatar" style="background:${color}">${BNU.esc(s.name.slice(0, 1))}</div>
            <div style="min-width:0">
              <div class="name"><a href="detail.html?id=${encodeURIComponent(s.id)}">${BNU.esc(s.name)}</a>${BNU.demoBadge(s)}${BNU.relBadge(s)}</div>
              <div class="meta">${meta || "—"}</div>
            </div>
          </div>
          <div class="tag-row">${chips || ""}</div>
        </div>`;
    },
    header(active) {
      return `
        <header class="site-header">
          <div class="header-inner">
            <a class="brand" href="index.html" aria-label="京师学林 首页">
              <span class="seal" aria-hidden="true">京</span>
              <span class="brand-text">
                <strong>京师学林</strong>
                <em>北师大中文系学者库 · 学术谱系</em>
              </span>
            </a>
            <nav class="main-nav" aria-label="主导航">
              ${NAV.map(([href, label]) =>
                `<a href="${href}"${href === active ? ' class="active" aria-current="page"' : ""}>${label}</a>`).join("")}
            </nav>
          </div>
        </header>`;
    },
    footer(data) {
      const all = data && data.scholars ? data.scholars : [];
      const n = all.filter(s => !s.demo && !s.external).length;  // 与首页「收录学者」同一口径
      const hasDemo = all.some(s => s.demo);
      const ld = window.LINEAGE_DATA;
      const stamp = ld && ld.generatedAt ? String(ld.generatedAt).slice(0, 10) : "";
      return `
        <footer class="site-footer">
          <div class="footer-inner">
            <div>
              <div class="f-brand">京师学林</div>
              <div>北京师范大学中文系学者库与学术谱系 · 数字人文课程期末作品</div>
              <div>数据取自官网师资页、学位论文题录与公开报道，逐条标注证据原文与来源链接；仅用于教学展示。</div>
              ${stamp ? `<div>数据版本：${BNU.esc(stamp)}</div>` : ""}
            </div>
            <div>
              <div class="f-links">
                ${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
              </div>
              <div style="margin-top:8px">
                ${n === 0
                  ? '<span class="demo-note">当前展示的全部为虚构示例数据（标有“示例数据”角标）。</span>'
                  : `已收录 ${n} 位在录学者${hasDemo ? "；标有“示例数据”角标的条目为演示用虚构数据" : ""}。`}
              </div>
            </div>
          </div>
        </footer>`;
    },
    // ECharts：统一字体与配色，避免图表里出现浏览器默认无衬线/默认蓝
    theme() {
      if (typeof echarts === "undefined" || window.__bnuThemeReady) return;
      echarts.registerTheme("bnu", {
        color: ["#c92820", "#2f6fb0", "#1f8a66", "#8a6d3b", "#c9a227", "#8b7bb0", "#b5533c"],
        textStyle: { fontFamily: '"Source Han Serif SC","Noto Serif SC","Songti SC",serif', color: "#40453e" },
        title: { textStyle: { color: "#171916", fontWeight: 600 } },
        categoryAxis: {
          axisLine: { lineStyle: { color: "#c7cac2" } },
          axisTick: { show: false },
          axisLabel: { color: "#6d726a", fontSize: 11.5 },
          splitLine: { show: false },
        },
        valueAxis: {
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: "#6d726a", fontSize: 11.5 },
          splitLine: { lineStyle: { color: "#e8e9e4", type: "dashed" } },
        },
        tooltip: {
          backgroundColor: "rgba(23,25,22,.94)",
          borderWidth: 0,
          textStyle: { color: "#f6f7f5", fontSize: 12 },
          extraCssText: "border-radius:4px;padding:9px 12px;box-shadow:0 8px 24px rgba(0,0,0,.18)",
        },
        legend: { textStyle: { color: "#6d726a", fontSize: 11.5 } },
      });
      window.__bnuThemeReady = true;
    },
    mount(id, option) {
      const el = document.getElementById(id);
      if (!el) return null;
      BNU.theme();
      const chart = echarts.init(el, window.__bnuThemeReady ? "bnu" : undefined);
      window.addEventListener("resize", () => chart.resize());
      chart.setOption(option);
      return chart;
    },
  };

  window.BNU = BNU;
})();
