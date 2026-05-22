// 商品详情页 — V2 视觉对齐 doc/mockups/figure/05_goods_detail_v1.png
// 保留原有：onPreviewImage / onContactSeller / onPlaceOrder / onShareAppMessage
// 新增：onSwiperChange / onToggleFavorite / onToggleFollow / onReport / onMakeOffer
const api = require("../../../services/api/index");
const auth = require("../../../utils/auth");
const formatter = require("../../../utils/formatter");

Page({
  data: {
    id: 0,
    item: null,
    loading: true,
    submitting: false,
    isMine: false,
    // —— 视觉态 ——
    currentSlide: 0,
    isFavorite: false,
    favoriteCount: 0,
    isFollowing: false,
    // —— 格式化字段 ——
    f: {},
  },

  onLoad(options) {
    const id = Number(options.id || 0);
    if (!id) {
      wx.showToast({ title: "参数错误", icon: "none" });
      return wx.navigateBack();
    }
    this.setData({ id });
    this.fetch();
  },

  async fetch() {
    this.setData({ loading: true });
    try {
      const item = await api.goods.detail(this.data.id);
      const me = auth.currentUser();
      this.setData({
        item,
        isMine: me && item && item.seller && item.seller.id === me.id,
        loading: false,
        // 初始化收藏 / 关注态（若后端已带 flag）
        isFavorite: !!(item && item.is_favorite),
        favoriteCount: (item && item.favorite_count) || 0,
        isFollowing: !!(item && item.seller && item.seller.is_following),
        f: {
          priceStr: formatter.formatPrice(item.price),
          condStr: formatter.conditionLabel(item.condition),
          relTime: formatter.relativeTime(item.created_at),
        },
      });
      wx.setNavigationBarTitle({ title: item.title || "商品详情" });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  // 轮播切换 —— 同步右下角计数胶囊
  onSwiperChange(e) {
    this.setData({ currentSlide: e.detail.current || 0 });
  },

  onPreviewImage(e) {
    const i = e.currentTarget.dataset.i;
    const urls = (this.data.item.images || []).map((x) => x.url);
    if (!urls.length) return;
    wx.previewImage({ current: urls[i], urls });
  },

  onContactSeller() {
    if (!auth.isLoggedIn()) return auth.redirectToLogin();
    if (this.data.isMine) {
      return wx.showToast({ title: "这是您自己的商品", icon: "none" });
    }
    const it = this.data.item;
    wx.navigateTo({
      url:
        "/pages/message/chat/chat?with=" +
        it.seller.id +
        "&good_id=" +
        it.id,
    });
  },

  onPlaceOrder() {
    if (!auth.isLoggedIn()) return auth.redirectToLogin();
    if (this.data.isMine) {
      return wx.showToast({ title: "不能购买自己的商品", icon: "none" });
    }
    if (this.data.item && this.data.item.status !== "on_sale") {
      return wx.showToast({ title: "商品当前不可购买", icon: "none" });
    }
    wx.navigateTo({ url: "/pages/order/create/create?good_id=" + this.data.id });
  },

  // ============================================================
  // V2 新增交互（占位 / 轻量乐观更新）
  // 真接口待 B5/B6 上线后从 services/api 引入
  // ============================================================

  onToggleFavorite() {
    if (!auth.isLoggedIn()) return auth.redirectToLogin();
    const nextFav = !this.data.isFavorite;
    const delta = nextFav ? 1 : -1;
    // 乐观更新
    this.setData({
      isFavorite: nextFav,
      favoriteCount: Math.max(0, (this.data.favoriteCount || 0) + delta),
    });
    wx.showToast({
      title: nextFav ? "已收藏" : "已取消收藏",
      icon: "none",
      duration: 1200,
    });
    // TODO[B5]: 调用 api.goods.toggleFavorite(this.data.id) 并在失败时回滚
  },

  onToggleFollow() {
    if (!auth.isLoggedIn()) return auth.redirectToLogin();
    if (this.data.isMine) {
      return wx.showToast({ title: "不能关注自己", icon: "none" });
    }
    const next = !this.data.isFollowing;
    this.setData({ isFollowing: next });
    wx.showToast({
      title: next ? "已关注卖家" : "已取消关注",
      icon: "none",
      duration: 1200,
    });
    // TODO[B5]: 调用 api.users.follow(this.data.item.seller.id)
  },

  onReport() {
    if (!auth.isLoggedIn()) return auth.redirectToLogin();
    const it = this.data.item || {};
    wx.showActionSheet({
      itemList: ["商品描述与实际不符", "涉嫌违禁物品", "疑似虚假发布", "其他"],
      success: (res) => {
        wx.showToast({
          title: "举报已提交，将由管理员审核",
          icon: "none",
          duration: 1600,
        });
        // TODO[B7]: 调用 api.admin / reports 接口提交举报，good_id = it.id
      },
      fail: () => {},
    });
  },

  onMakeOffer() {
    if (!auth.isLoggedIn()) return auth.redirectToLogin();
    if (this.data.isMine) {
      return wx.showToast({ title: "不能对自己的商品出价", icon: "none" });
    }
    if (this.data.item && this.data.item.status !== "on_sale") {
      return wx.showToast({ title: "商品当前不可出价", icon: "none" });
    }
    // V2 议价 —— offer-card 配套页面待 B5 上线
    // 当前用 wx.showModal 收一个出价金额作为占位交互
    wx.showModal({
      title: "出价",
      placeholderText: "请输入出价金额（CC）",
      editable: true,
      content: "",
      success: (res) => {
        if (!res.confirm) return;
        const amount = parseFloat(res.content);
        if (!amount || amount <= 0) {
          return wx.showToast({ title: "请输入有效的出价金额", icon: "none" });
        }
        wx.showToast({
          title: "已发送出价 " + amount + " CC",
          icon: "none",
          duration: 1500,
        });
        // TODO[B5]: 调用 api.offers.create({good_id, amount}) 并跳转 offer/list
      },
    });
  },

  onShareAppMessage() {
    const it = this.data.item || {};
    return {
      title: it.title,
      path: "/pages/goods/detail/detail?id=" + it.id,
      imageUrl: it.cover_url,
    };
  },
});
