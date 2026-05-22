// 首页 — 瀑布流 + 搜索 + 分类入口
const api = require("../../services/api/index");

// 排序 tabs：综合 / 最新 / 价格（对齐 pages.yaml P03_index 与 mockup）
const SORT_TABS = [
  { key: "comprehensive", label: "综合" },
  { key: "latest", label: "最新" },
  { key: "price", label: "价格" },
];

// 分类 chips 兜底（拉接口失败时，按 mockup 文案给一个静态版）
const FALLBACK_CATEGORIES = [
  { id: 0, name: "全部" },
  { id: -1, name: "数码" },
  { id: -2, name: "图书" },
  { id: -3, name: "服饰" },
  { id: -4, name: "生活" },
  { id: -5, name: "票务" },
];

Page({
  data: {
    keyword: "",
    sortTabs: SORT_TABS,
    sort: "comprehensive",
    sortActiveIndex: 0,

    categories: FALLBACK_CATEGORIES,
    activeCategoryId: 0, // 0 = 全部

    list: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
  },

  onLoad() {
    this.loadCategories();
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadMore();
  },

  /**
   * 拉分类（顶部横向 chip 列表）
   */
  async loadCategories() {
    try {
      const list = await api.categories.tree();
      if (list && list.length) {
        this.setData({ categories: [{ id: 0, name: "全部" }, ...list] });
      }
    } catch (e) {
      // 静默失败：保留兜底分类
      console.warn("[index] load categories failed", e);
    }
  },

  buildQuery(page) {
    const q = {
      page,
      page_size: this.data.pageSize,
      sort: this.data.sort,
    };
    // 负 id 是兜底分类（接口未返回真实分类时使用），不下发 category_id
    if (this.data.activeCategoryId > 0) q.category_id = this.data.activeCategoryId;
    if (this.data.keyword) q.keyword = this.data.keyword;
    return q;
  },

  /**
   * 重置分页 + 重新拉第一页
   */
  async refresh() {
    this.setData({ page: 1, hasMore: true, list: [], loading: true });
    try {
      const data = await api.goods.list(this.buildQuery(1));
      const items = (data && data.items) || [];
      this.setData({
        list: items,
        hasMore: items.length >= this.data.pageSize,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async loadMore() {
    const next = this.data.page + 1;
    this.setData({ loading: true, page: next });
    try {
      const data = await api.goods.list(this.buildQuery(next));
      const items = (data && data.items) || [];
      this.setData({
        list: this.data.list.concat(items),
        hasMore: items.length >= this.data.pageSize,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false, page: next - 1 });
    }
  },

  // ---------- Vant 事件 ----------

  /** van-search change（双向绑定） */
  onSearchChange(e) {
    this.setData({ keyword: e.detail });
  },

  /** van-search search（回车确认） */
  onSearchConfirm() {
    this.refresh();
  },

  /** van-search clear（清空 icon） */
  onSearchClear() {
    this.setData({ keyword: "" });
    this.refresh();
  },

  /** 右侧漏斗筛选 icon（占位：toast 提示，后续接 filter popup） */
  onFilterTap() {
    wx.showToast({ title: "筛选功能开发中", icon: "none" });
  },

  /** van-tabs change（排序） */
  onSortChange(e) {
    const idx = e.detail.index;
    const tab = this.data.sortTabs[idx];
    if (!tab || tab.key === this.data.sort) return;
    this.setData({ sort: tab.key, sortActiveIndex: idx });
    this.refresh();
  },

  /** 分类 chip 点击 */
  onCategoryChange(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (id !== this.data.activeCategoryId) {
      this.setData({ activeCategoryId: id });
      this.refresh();
    }
  },

  onPublishTap() {
    wx.switchTab({ url: "/pages/goods/publish/publish" });
  },

  // ---------- 兼容旧接口（避免外部 wxml 残留引用报错） ----------
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },
});
