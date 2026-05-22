// 商品发布页（V2 — 适配 Vant Weapp + design tokens）
//   - 9 宫格 van-uploader（受控 file-list）
//   - AI 标题优化 / AI 描述生成
//   - 担保质押开关、实物认证（V2 stub，后端未上线）
//   - 表单校验 + 提交 + 保存草稿
const api = require("../../../services/api/index");
const auth = require("../../../utils/auth");

const CONDITION_OPTIONS = [
  { value: 5, label: "几乎全新" },
  { value: 4, label: "九成新" },
  { value: 3, label: "成色良好" },
  { value: 2, label: "可正常使用" },
  { value: 1, label: "有明显使用痕迹" },
];

const DRAFT_STORAGE_KEY = "goods_publish_draft_v2";

Page({
  data: {
    // ===== 分类 =====
    categories: [],
    categoryIndex: 0,

    // ===== 表单字段 =====
    title: "",
    description: "",
    price: "",
    remark: "",

    // ===== 成色 =====
    conditionOptions: CONDITION_OPTIONS,
    conditionIndex: 1, // 默认 "九成新"

    // ===== 图片上传 =====
    // van-uploader 受控 file-list：每项 { url, status?, message?, _remoteUrl }
    // _remoteUrl 是上传成功后的服务端 URL，提交时用它而不是本地临时路径
    uploaderFiles: [],

    // ===== textarea 自动撑高（van-field type=textarea autosize）=====
    descAutosize: { minHeight: 120, maxHeight: 300 },

    // ===== 担保质押（V2 stub）=====
    pledgeEnabled: true,

    // ===== loading 状态 =====
    aiOptimizing: false,
    aiGenerating: false,
    savingDraft: false,
    submitting: false,
  },

  onLoad() {
    if (!auth.isLoggedIn()) return auth.redirectToLogin();
    this.loadCategories();
    this.restoreDraft();
  },

  async loadCategories() {
    try {
      const list = await api.categories.tree();
      this.setData({ categories: list || [] });
    } catch (e) {
      console.warn("[publish] load categories failed", e);
    }
  },

  // ============================================================
  // 草稿（本地存储）
  // ============================================================
  restoreDraft() {
    try {
      const draft = wx.getStorageSync(DRAFT_STORAGE_KEY);
      if (!draft || typeof draft !== "object") return;
      this.setData({
        title: draft.title || "",
        description: draft.description || "",
        price: draft.price || "",
        remark: draft.remark || "",
        conditionIndex:
          typeof draft.conditionIndex === "number" ? draft.conditionIndex : 1,
        uploaderFiles: Array.isArray(draft.uploaderFiles)
          ? draft.uploaderFiles
          : [],
        pledgeEnabled:
          typeof draft.pledgeEnabled === "boolean" ? draft.pledgeEnabled : true,
      });
    } catch (e) {
      // 忽略
    }
  },

  // ============================================================
  // 输入事件（Vant van-field bind:change 的 e.detail 直接是 value）
  // ============================================================
  onTitleInput(e) { this.setData({ title: e.detail }); },
  onDescInput(e) { this.setData({ description: e.detail }); },
  onPriceInput(e) { this.setData({ price: e.detail }); },
  onRemarkInput(e) { this.setData({ remark: e.detail }); },

  onCategoryChange(e) {
    this.setData({ categoryIndex: Number(e.detail.value) });
  },
  onConditionChange(e) {
    this.setData({ conditionIndex: Number(e.detail.value) });
  },

  // ============================================================
  // 9 宫格图片上传（van-uploader）
  // ============================================================
  async onUploaderAfterRead(e) {
    // e.detail.file 可能是单个对象（单选）或数组（multiple 多选）
    const raw = e.detail.file;
    const incoming = Array.isArray(raw) ? raw : [raw];

    // 立刻把临时路径塞进 file-list 显示"上传中"
    const existing = this.data.uploaderFiles.slice();
    const startIdx = existing.length;
    const placeholders = incoming.map((f) => ({
      url: f.url || f.tempFilePath || f.path,
      status: "uploading",
      message: "上传中",
    }));
    this.setData({
      uploaderFiles: existing.concat(placeholders),
    });

    // 逐张上传
    for (let i = 0; i < incoming.length; i++) {
      const f = incoming[i];
      const localPath = f.url || f.tempFilePath || f.path;
      const idx = startIdx + i;
      try {
        const resp = await api.uploads.uploadImage(localPath);
        const remoteUrl = (resp && (resp.url || resp.data && resp.data.url)) || localPath;
        const list = this.data.uploaderFiles.slice();
        if (list[idx]) {
          list[idx] = {
            url: remoteUrl,
            status: "done",
            _remoteUrl: remoteUrl,
          };
          this.setData({ uploaderFiles: list });
        }
      } catch (err) {
        const list = this.data.uploaderFiles.slice();
        if (list[idx]) {
          list[idx] = {
            url: localPath,
            status: "failed",
            message: "上传失败",
          };
          this.setData({ uploaderFiles: list });
        }
        wx.showToast({
          title: "图片上传失败" + (err && err.message ? "：" + err.message : ""),
          icon: "none",
        });
      }
    }
  },

  onUploaderDelete(e) {
    // e.detail.index 是要删的索引
    const i = e.detail && typeof e.detail.index === "number" ? e.detail.index : -1;
    if (i < 0) return;
    const list = this.data.uploaderFiles.slice();
    list.splice(i, 1);
    this.setData({ uploaderFiles: list });
  },

  // ============================================================
  // AI 辅助
  // ============================================================
  async onAITitleOptimize() {
    const draft = (this.data.title || "").trim();
    if (!draft) return wx.showToast({ title: "请先输入标题草稿", icon: "none" });
    const cat = this.data.categories[this.data.categoryIndex];
    if (!cat) return wx.showToast({ title: "请先选择分类", icon: "none" });

    this.setData({ aiOptimizing: true });
    try {
      const data = await api.ai.optimizeTitle({
        draft,
        category_id: cat.id,
      });
      this.setData({ title: (data && data.content) || draft });
      wx.showToast({
        title: data && data.is_fallback ? "AI 不可用，已用模板" : "标题已优化",
        icon: "none",
      });
    } catch (e) {
      // request 层已展示错误 toast
    } finally {
      this.setData({ aiOptimizing: false });
    }
  },

  async onAIDescGenerate() {
    const cat = this.data.categories[this.data.categoryIndex];
    if (!cat) return wx.showToast({ title: "请先选择分类", icon: "none" });
    if (!this.data.title) return wx.showToast({ title: "请先填写标题", icon: "none" });

    const condition = this.data.conditionOptions[this.data.conditionIndex].value;
    const price = Number(this.data.price || 0);
    this.setData({ aiGenerating: true });
    try {
      const data = await api.ai.generateDescription({
        category_id: cat.id,
        title: this.data.title,
        condition,
        price,
      });
      this.setData({
        description: (data && data.content) || this.data.description,
      });
      wx.showToast({
        title: data && data.is_fallback ? "AI 不可用，已用模板" : "描述已生成",
        icon: "none",
      });
    } catch (e) {
      // 同上
    } finally {
      this.setData({ aiGenerating: false });
    }
  },

  // ============================================================
  // 担保 / 认证（V2 stub — 后端未上线）
  // ============================================================
  onPledgeChange(e) {
    // Vant van-switch 的 e.detail 直接是新值（boolean）
    const checked = typeof e.detail === "boolean" ? e.detail : !!(e.detail && e.detail.value);
    this.setData({ pledgeEnabled: checked });
    wx.showToast({
      title: checked ? "担保质押已开启（演示）" : "担保质押已关闭",
      icon: "none",
    });
  },

  onOpenVerify() {
    // 实物认证：V2 占位，后端未上线
    wx.showToast({ title: "实物认证即将上线", icon: "none" });
  },

  // ============================================================
  // 保存草稿（本地）
  // ============================================================
  onSaveDraft() {
    this.setData({ savingDraft: true });
    try {
      const draft = {
        title: this.data.title,
        description: this.data.description,
        price: this.data.price,
        remark: this.data.remark,
        conditionIndex: this.data.conditionIndex,
        uploaderFiles: this.data.uploaderFiles,
        pledgeEnabled: this.data.pledgeEnabled,
        _savedAt: Date.now(),
      };
      wx.setStorageSync(DRAFT_STORAGE_KEY, draft);
      wx.showToast({ title: "草稿已保存", icon: "success" });
    } catch (e) {
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      // 给一点 loading 时间，避免闪烁
      setTimeout(() => this.setData({ savingDraft: false }), 200);
    }
  },

  _clearDraft() {
    try { wx.removeStorageSync(DRAFT_STORAGE_KEY); } catch (e) {}
  },

  // ============================================================
  // 提交
  // ============================================================
  async onSubmit() {
    const errMsg = this._validate();
    if (errMsg) return wx.showToast({ title: errMsg, icon: "none" });

    // 提取已上传成功的图片 URL
    const images = this.data.uploaderFiles
      .filter((f) => f && (f._remoteUrl || (f.status !== "uploading" && f.status !== "failed")))
      .map((f, i) => ({
        url: f._remoteUrl || f.url,
        media_type: "image",
        sort_order: i,
      }));

    if (images.length === 0) {
      return wx.showToast({ title: "至少上传 1 张图片", icon: "none" });
    }

    this.setData({ submitting: true });
    try {
      const cat = this.data.categories[this.data.categoryIndex];
      const condition = this.data.conditionOptions[this.data.conditionIndex].value;
      const payload = {
        title: this.data.title.trim(),
        description: (this.data.description || "").trim(),
        price: Number(this.data.price),
        category_id: cat.id,
        condition,
        images,
        remark: (this.data.remark || "").trim(),
        // V2 stub：担保质押状态（后端字段未上线时被忽略）
        pledge_enabled: this.data.pledgeEnabled,
      };
      const created = await api.goods.create(payload);
      this._clearDraft();
      wx.showToast({ title: "发布成功", icon: "success" });
      this._resetForm();
      setTimeout(() => {
        wx.redirectTo({
          url: "/pages/goods/detail/detail?id=" + (created && created.id),
        });
      }, 800);
    } catch (e) {
      // request 层已 toast
    } finally {
      this.setData({ submitting: false });
    }
  },

  _validate() {
    if (this.data.categories.length === 0) return "分类加载中，请稍候";
    if (!this.data.title || !this.data.title.trim()) return "请输入标题";
    if (this.data.title.length > 64) return "标题不超过 64 字";
    if (!this.data.price) return "请输入价格";
    const p = Number(this.data.price);
    if (isNaN(p) || p < 0) return "价格无效";
    if (p > 100000) return "价格不超过 10 万";
    if (this.data.uploaderFiles.length === 0) return "至少上传 1 张图片";
    // 还在上传中的图片
    if (this.data.uploaderFiles.some((f) => f && f.status === "uploading")) {
      return "图片还在上传，请稍候";
    }
    return null;
  },

  _resetForm() {
    this.setData({
      title: "",
      description: "",
      price: "",
      remark: "",
      uploaderFiles: [],
      conditionIndex: 1,
      pledgeEnabled: true,
    });
  },
});
