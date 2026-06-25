const api = require("../../utils/api");

const HOUR_OPTIONS = [
  { value: "zi", label: "子时" },
  { value: "chou", label: "丑时" },
  { value: "yin", label: "寅时" },
  { value: "mao", label: "卯时" },
  { value: "chen", label: "辰时" },
  { value: "si", label: "巳时" },
  { value: "wu", label: "午时" },
  { value: "wei", label: "未时" },
  { value: "shen", label: "申时" },
  { value: "you", label: "酉时" },
  { value: "xu", label: "戌时" },
  { value: "hai", label: "亥时" }
];

const HOUR_RANGES = {
  zi: "23:00 - 01:00",
  chou: "01:00 - 03:00",
  yin: "03:00 - 05:00",
  mao: "05:00 - 07:00",
  chen: "07:00 - 09:00",
  si: "09:00 - 11:00",
  wu: "11:00 - 13:00",
  wei: "13:00 - 15:00",
  shen: "15:00 - 17:00",
  you: "17:00 - 19:00",
  xu: "19:00 - 21:00",
  hai: "21:00 - 23:00"
};

Page({
  data: {
    owner: null,
    submitting: false,
    errorMessage: ""
  },

  onShow() {
    this.loadOwner();
  },

  async loadOwner() {
    try {
      const data = await api.getProfile();
      this.setData({ owner: data.owner || null });
    } catch (error) {
      this.setData({ owner: null, errorMessage: "主档案加载失败" });
    }
  },

  async submit() {
    const { owner, submitting } = this.data;
    if (submitting) {
      return;
    }
    if (!owner) {
      wx.showToast({ title: "请先创建本命盘", icon: "none" });
      return;
    }

    this.setData({ submitting: true, errorMessage: "" });
    wx.showLoading({ title: "生成年度运势中" });
    try {
      const result = await api.createChart({ mode: "annual" });
      getApp().globalData.currentRecord = result.record;
      wx.navigateTo({ url: `/pages/interpretation/index?id=${result.record.id}` });
    } catch (error) {
      this.setData({
        errorMessage: error && error.message ? error.message : "年度运势服务暂时不可用，请稍后重试"
      });
      wx.showToast({ title: "年度运势生成失败", icon: "none" });
    } finally {
      wx.hideLoading();
      this.setData({ submitting: false });
    }
  },

  backHome() {
    wx.redirectTo({ url: "/pages/home/index" });
  },

  openDaily() {
    wx.redirectTo({ url: "/pages/daily/index" });
  },

  openInterpretation() {
    wx.navigateTo({ url: "/pages/interpretation/index" });
  },

  openArchive() {
    wx.redirectTo({ url: "/pages/archive/index" });
  },

  openRelationship() {
    wx.navigateTo({ url: "/pages/relationship/index" });
  },

  createNatal() {
    wx.navigateTo({ url: "/pages/chart-form/index" });
  }
});
