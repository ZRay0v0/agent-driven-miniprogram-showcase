// 登录页 P01_login — 微信一键授权 + 校园身份绑定入口
// UI 已迁移到 Vant Weapp，业务逻辑（onWxLogin / onBindPassword / onLogout / onBrowseOnly）保持不变
const auth = require("../../../utils/auth");

Page({
  data: {
    loading: false,
    user: null,
    needBindCampus: false,
  },

  onLoad() {
    const u = auth.currentUser();
    if (u) {
      this.setData({ user: u, needBindCampus: !u.student_id });
    }
  },

  /**
   * 点击微信一键登录
   * 注意：van-button 触发的是 bind:click 事件，e 形参保留以便后续扩展
   */
  async onWxLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const data = await auth.wxLogin();
      this.setData({ user: data.user, needBindCampus: !data.user.student_id });
      wx.showToast({ title: "登录成功", icon: "success" });
      // 已绑定 → 直接进入首页
      if (data.user.student_id) {
        setTimeout(() => wx.switchTab({ url: "/pages/index/index" }), 800);
      }
    } catch (err) {
      console.error("[login] failed", err);
      // 开发期降级：后端未启动时弹窗询问是否使用 mock 账号继续
      const isNetworkError = err && (err.status === 0 || (err.message || "").includes("网络"));
      if (isNetworkError) {
        this.setData({ loading: false });
        wx.showModal({
          title: "后端未连接",
          content: "无法连接到后端服务器。是否使用 mock 测试账号继续？\n（仅用于本地开发预览 UI）",
          confirmText: "Mock 登录",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) this.loginAsMock();
          },
        });
        return;
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 开发期 mock 登录：注入一个测试用户到本地缓存，跳过后端
   */
  loginAsMock() {
    const mockUser = {
      id: 1,
      nickname: "测试用户",
      avatar: "/images/placeholder/avatar.png",
      role: "buyer",
      student_id: "DEV20211000",
      college: "计算机学院",
      grade: "大三",
      coin_balance: 1000,
      credit_score: 100,
    };
    auth.persistSession({ access_token: "mock-dev-token", user: mockUser });
    this.setData({ user: mockUser, needBindCampus: false });
    wx.showToast({ title: "Mock 登录成功", icon: "success" });
    setTimeout(() => wx.switchTab({ url: "/pages/index/index" }), 800);
  },

  /**
   * 跳转到密码设置页（绑定密码）
   */
  onBindPassword() {
    wx.navigateTo({ url: "/pages/auth/password/password" });
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: "确认退出登录？",
      success: (res) => {
        if (res.confirm) {
          auth.clearSession();
          this.setData({ user: null });
        }
      },
    });
  },

  /**
   * 跳过登录（仅浏览，许多操作仍需登录）
   */
  onBrowseOnly() {
    wx.switchTab({ url: "/pages/index/index" });
  },
});
