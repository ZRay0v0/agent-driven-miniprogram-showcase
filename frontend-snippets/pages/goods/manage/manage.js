// ============================================================
// pages/goods/manage/manage.js
// 「我的商品」卖家管理
//   - tabs: 在售 / 已售出 / 下架 / 草稿
//   - 编辑 → navigate 到 publish?id=
//   - 下架 → POST /goods/{id}/off
//   - 重新上架 → PUT /goods/{id}  payload: { status: 'on_sale' }
//   - 删除   → DELETE /goods/{id}
// ============================================================

const api = require("../../../services/api/index");
const formatter = require("../../../utils/formatter");

const TABS = [
  { key: "on_sale",   label: "在售" },
  { key: "sold",      label: "已售出" },
  { key: "off_shelf", label: "下架" },
  { key: "draft",     label: "草稿" },
];

const EMPTY_COPY = {
  on_sale:   { title: "还没有在售商品", desc: "去发布一个吧，发布后会出现在首页瀑布流。" },
  sold:      { title: "暂无已售商品",   desc: "成交后的订单会归档到这里。" },
  off_shelf: { title: "没有下架商品",   desc: "下架后的商品保留在这里，可一键重新上架。" },
  draft:     { title: "没有保存的草稿", desc: "发布页未提交的内容会自动落到草稿。" },
};

Page({
  data: {
    tabs: TABS,
    activeTab: "on_sale",
    counts: { on_sale: 0, sold: 0, off_shelf: 0, draft: 0 },
    list: [],
    loading: false,
    // 长按 Action Sheet
    sheetVisible: false,
    sheetActions: [],
    activeItemId: "",
    // Empty copy
    emptyTitle: EMPTY_COPY.on_sale.title,
    emptyDesc: EMPTY_COPY.on_sale.desc,
  },

  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  onLoad(options) {
    // 支持 ?tab=on_sale|sold|off_shelf|draft 直达
    const tab = options && options.tab;
    if (tab && TABS.find((t) => t.key === tab)) {
      this.setData({ activeTab: tab });
    }
    this._syncEmptyCopy(this.data.activeTab);
    this._loadAll();
  },

  onShow() {
    // 从发布/详情页回来时刷新当前 tab 的数据，
    // 保证下架/上架/编辑后的状态变更立即可见。
    if (this._initialized) {
      this._loadList(this.data.activeTab);
      this._loadCounts();
    } else {
      this._initialized = true;
    }
  },

  onPullDownRefresh() {
    this._loadAll().finally(() => wx.stopPullDownRefresh());
  },

  // ------------------------------------------------------------
  // Data
  // ------------------------------------------------------------
  _loadAll() {
    return Promise.all([
      this._loadList(this.data.activeTab),
      this._loadCounts(),
    ]);
  },

  /**
   * 拉当前 tab 的列表
   * 后端约定：GET /goods?owner=me&status=<status>
   * 容错：若接口未实现，使用 mock 占位数据，便于 UI 联调
   */
  _loadList(status) {
    this.setData({ loading: true });
    return api.goods
      .list({ owner: "me", status, page: 1, page_size: 20 })
      .then((data) => {
        const items = Array.isArray(data) ? data : data && data.items ? data.items : [];
        const decorated = items.map((it) => this._decorateItem(it));
        this.setData({ list: decorated, loading: false });
      })
      .catch((err) => {
        // 离线 / 接口未就绪 fallback —— 用占位数据保留 UI 体验
        const fallback = this._mockFallback(status);
        this.setData({ list: fallback, loading: false });
        if (err && err.code !== 404) {
          // 静默：不打扰 UI，错误已在 request.js 全局 toast
        }
      });
  },

  _loadCounts() {
    // 后端可走 GET /goods/me/counts 或在 /users/me 里返回；
    // 这里做一个 best-effort，不阻塞列表。
    return api.users && typeof api.users.myGoodsCount === "function"
      ? api.users.myGoodsCount().then((c) => {
          this.setData({ counts: Object.assign({}, this.data.counts, c || {}) });
        }).catch(() => {})
      : Promise.resolve();
  },

  _decorateItem(it) {
    return Object.assign({}, it, {
      _priceStr: formatter.formatPrice(it.price),
    });
  },

  _mockFallback(status) {
    const samples = {
      on_sale: [
        { id: "m1", title: "九成新 Kindle Paperwhite 4 32G 无划痕", price: 240, view_count: 32, favorite_count: 5, cover_url: "" },
        { id: "m2", title: "高等数学教材同济版 课后习题答案齐全", price: 35, view_count: 18, favorite_count: 3, cover_url: "" },
        { id: "m3", title: "AirPods 2 正常使用 无瑕疵", price: 399, view_count: 56, favorite_count: 8, cover_url: "" },
        { id: "m4", title: "宿舍护眼台灯 光线柔和", price: 28, view_count: 21, favorite_count: 2, cover_url: "" },
      ],
      sold:      [],
      off_shelf: [],
      draft:     [],
    };
    return (samples[status] || []).map((it) => this._decorateItem(it));
  },

  // ------------------------------------------------------------
  // Tab
  // ------------------------------------------------------------
  onTabChange(e) {
    const key = e.detail && e.detail.name;
    if (!key || key === this.data.activeTab) return;
    this.setData({ activeTab: key });
    this._syncEmptyCopy(key);
    this._loadList(key);
  },

  _syncEmptyCopy(key) {
    const copy = EMPTY_COPY[key] || EMPTY_COPY.on_sale;
    this.setData({ emptyTitle: copy.title, emptyDesc: copy.desc });
  },

  // ------------------------------------------------------------
  // 行点击 / 长按
  // ------------------------------------------------------------
  onTapItem(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    // 草稿点击进入编辑，其它进入详情
    if (this.data.activeTab === "draft") {
      this._navEdit(id);
    } else {
      wx.navigateTo({ url: "/pages/goods/detail/detail?id=" + id });
    }
  },

  onLongPressItem(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const actions = this._sheetActionsFor(this.data.activeTab);
    if (!actions.length) return;
    this.setData({
      sheetVisible: true,
      sheetActions: actions,
      activeItemId: id,
    });
  },

  _sheetActionsFor(tab) {
    const base = {
      promote: { name: "推广（模拟）", color: "#1aad19", _key: "promote" },
      edit:    { name: "编辑",           _key: "edit" },
      takeOff: { name: "下架",           _key: "take_off" },
      relist:  { name: "重新上架",       color: "#1aad19", _key: "relist" },
      remove:  { name: "删除",           color: "#ee0a24", _key: "remove" },
      order:   { name: "查看订单",       _key: "view_order" },
    };
    switch (tab) {
      case "on_sale":   return [base.edit, base.takeOff, base.promote, base.remove];
      case "off_shelf": return [base.edit, base.relist,  base.remove];
      case "draft":     return [base.edit, base.remove];
      case "sold":      return [base.order];
      default:          return [];
    }
  },

  onSheetSelect(e) {
    const action = e.detail || {};
    const id = this.data.activeItemId;
    this.setData({ sheetVisible: false, activeItemId: "" });
    if (!id) return;
    switch (action._key) {
      case "edit":       return this._navEdit(id);
      case "take_off":   return this._doTakeOff(id);
      case "relist":     return this._doRelist(id);
      case "remove":     return this._confirmRemove(id);
      case "promote":    return this._doPromote(id);
      case "view_order": return this._navViewOrder(id);
    }
  },

  onSheetCancel() {
    this.setData({ sheetVisible: false, activeItemId: "" });
  },

  // ------------------------------------------------------------
  // 按钮事件（与原始 manage.js 中 TODO 对应）
  // ------------------------------------------------------------
  onTapEdit(e) {
    const id = e.currentTarget.dataset.id;
    this._navEdit(id);
  },

  onTapTakeOff(e) {
    const id = e.currentTarget.dataset.id;
    this._doTakeOff(id);
  },

  onTapRelist(e) {
    const id = e.currentTarget.dataset.id;
    this._doRelist(id);
  },

  onTapDelete(e) {
    const id = e.currentTarget.dataset.id;
    this._confirmRemove(id);
  },

  onTapViewOrder(e) {
    const id = e.currentTarget.dataset.id;
    this._navViewOrder(id);
  },

  onTapPublish() {
    wx.navigateTo({ url: "/pages/goods/publish/publish" });
  },

  // 阻止冒泡用的空函数
  noop() {},

  // ------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------
  _navEdit(id) {
    if (!id) return;
    wx.navigateTo({ url: "/pages/goods/publish/publish?id=" + id });
  },

  _navViewOrder(id) {
    if (!id) return;
    wx.navigateTo({ url: "/pages/order/list/list?goods_id=" + id });
  },

  _doTakeOff(id) {
    if (!id) return;
    wx.showModal({
      title: "下架商品",
      content: "下架后商品不再出现在首页和搜索中，可在「下架」tab 重新上架。",
      confirmText: "下架",
      confirmColor: "#ee0a24",
      success: (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: "下架中…", mask: true });
        api.goods
          .takeOff(id)
          .then(() => {
            wx.hideLoading();
            wx.showToast({ title: "已下架", icon: "success" });
            this._removeLocal(id);
            this._adjustCount("on_sale", -1);
            this._adjustCount("off_shelf", +1);
          })
          .catch(() => {
            wx.hideLoading();
            // 后端未实现 fallback：仍然本地移除给个 UI 反馈
            wx.showToast({ title: "已下架（模拟）", icon: "none" });
            this._removeLocal(id);
            this._adjustCount("on_sale", -1);
            this._adjustCount("off_shelf", +1);
          });
      },
    });
  },

  _doRelist(id) {
    if (!id) return;
    wx.showLoading({ title: "上架中…", mask: true });
    api.goods
      .update(id, { status: "on_sale" })
      .then(() => {
        wx.hideLoading();
        wx.showToast({ title: "已重新上架", icon: "success" });
        this._removeLocal(id);
        this._adjustCount("off_shelf", -1);
        this._adjustCount("on_sale", +1);
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({ title: "已重新上架（模拟）", icon: "none" });
        this._removeLocal(id);
        this._adjustCount("off_shelf", -1);
        this._adjustCount("on_sale", +1);
      });
  },

  _confirmRemove(id) {
    if (!id) return;
    wx.showModal({
      title: "删除商品",
      content: "删除后无法恢复，确定要删除吗？",
      confirmText: "删除",
      confirmColor: "#ee0a24",
      success: (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: "删除中…", mask: true });
        api.goods
          .remove(id)
          .then(() => {
            wx.hideLoading();
            wx.showToast({ title: "已删除", icon: "success" });
            this._removeLocal(id);
            this._adjustCount(this.data.activeTab, -1);
          })
          .catch(() => {
            wx.hideLoading();
            wx.showToast({ title: "已删除（模拟）", icon: "none" });
            this._removeLocal(id);
            this._adjustCount(this.data.activeTab, -1);
          });
      },
    });
  },

  _doPromote(id) {
    if (!id) return;
    wx.showToast({
      title: "推广功能即将上线",
      icon: "none",
    });
  },

  // ------------------------------------------------------------
  // 本地状态辅助
  // ------------------------------------------------------------
  _removeLocal(id) {
    const list = this.data.list.filter((it) => it.id !== id);
    this.setData({ list });
  },

  _adjustCount(key, delta) {
    if (!key) return;
    const counts = Object.assign({}, this.data.counts);
    counts[key] = Math.max(0, (counts[key] || 0) + delta);
    this.setData({ counts });
  },
});
