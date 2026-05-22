// password 页 — 为微信账号绑定本地密码，支持改密。
// UI: doc/mockups/figure/02_password_v1.png（Vant + design tokens 实现）
// API:
//   - 改密：PUT /auth/password  body: { old_password, new_password }
//   - 首绑：POST /auth/bind-password  body: { password }
//
// 进入方式：
//   - 已绑定用户从 "我的 → 修改密码" 进入（mode 默认 = change）
//   - 首次绑定可通过 query ?mode=bind 进入（隐藏"当前密码"行）

const api = require("../../../services/api/index");
const auth = require("../../../utils/auth");

// 密码强度规则：至少 8 位，含字母和数字
const PWD_RULE = /^(?=.*[A-Za-z])(?=.*\d)[\w!@#$%^&*()_\-+=.]{8,}$/;

Page({
  data: {
    // 模式：'change' (默认) | 'bind'
    mode: "change",

    // 输入值
    oldPwd: "",
    newPwd: "",
    confirmPwd: "",

    // 可见性切换
    showOld: false,
    showNew: false,
    showConfirm: false,

    // 状态
    loading: false,
    ruleOk: false,      // 新密码满足强度规则
    confirmOk: false,   // 两次新密码一致
    canSubmit: false,   // 综合可提交
  },

  onLoad(options) {
    const mode = options && options.mode === "bind" ? "bind" : "change";
    this.setData({ mode });

    if (mode === "bind") {
      wx.setNavigationBarTitle({ title: "设置密码" });
    }
  },

  onShow() {
    // 无需主动刷新；登录态由 utils/auth 统一管理
  },

  // ---------- 输入事件 ----------

  onOldInput(e) {
    this.setData({ oldPwd: e.detail || "" }, this._recomputeValidity);
  },

  onNewInput(e) {
    this.setData({ newPwd: e.detail || "" }, this._recomputeValidity);
  },

  onConfirmInput(e) {
    this.setData({ confirmPwd: e.detail || "" }, this._recomputeValidity);
  },

  /**
   * 切换密码可见性（点击 right-icon 触发）
   * data-target 标识该行对应的 showXxx 字段
   */
  onToggleVisible(e) {
    const target = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.target;
    if (!target) return;
    this.setData({ [target]: !this.data[target] });
  },

  // ---------- 校验 ----------

  _recomputeValidity() {
    const { mode, oldPwd, newPwd, confirmPwd } = this.data;
    const ruleOk = PWD_RULE.test(newPwd);
    const confirmOk = !!confirmPwd && newPwd === confirmPwd;
    const oldOk = mode === "bind" ? true : oldPwd.length > 0;
    const canSubmit = oldOk && ruleOk && confirmOk;
    this.setData({ ruleOk, confirmOk, canSubmit });
  },

  // ---------- 提交 ----------

  async onSubmit() {
    if (this.data.loading || !this.data.canSubmit) return;

    const { mode, oldPwd, newPwd, confirmPwd } = this.data;

    // 二次防御性校验（按钮已禁用，但 setData 异步，挡一手）
    if (mode === "change" && !oldPwd) {
      return wx.showToast({ title: "请输入当前密码", icon: "none" });
    }
    if (!PWD_RULE.test(newPwd)) {
      return wx.showToast({ title: "新密码不符合规则", icon: "none" });
    }
    if (newPwd !== confirmPwd) {
      return wx.showToast({ title: "两次密码不一致", icon: "none" });
    }
    if (mode === "change" && oldPwd === newPwd) {
      return wx.showToast({ title: "新密码不能与旧密码相同", icon: "none" });
    }

    this.setData({ loading: true });
    try {
      if (mode === "bind") {
        await api.auth.bindPassword(newPwd);
      } else {
        await api.auth.changePassword(oldPwd, newPwd);
      }
      wx.showToast({ title: "密码已更新", icon: "success" });
      // 短暂展示 toast 后返回上一页
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack();
        } else {
          wx.switchTab({ url: "/pages/user/profile/profile" });
        }
      }, 800);
    } catch (err) {
      console.error("[password] submit failed", err);
      // request.js 已弹通用错误 toast，这里只兜底网络异常
      const msg = (err && err.message) || "";
      if (msg.includes("网络") || (err && err.status === 0)) {
        wx.showToast({ title: "网络异常，请稍后重试", icon: "none" });
      }
    } finally {
      this.setData({ loading: false });
    }
  },
});
