const api = require("../../utils/api");

Page({
  data: {
    daily: null,
    loading: true
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const data = await api.getDaily();
      this.setData({ daily: data, loading: false });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: "今日运势加载失败", icon: "none" });
    }
  },

  backHome() {
    wx.redirectTo({ url: "/pages/home/index" });
  },

  openAnnual() {
    wx.redirectTo({ url: "/pages/annual/index" });
  },

  openRelationship() {
    wx.navigateTo({ url: "/pages/relationship/index" });
  },

  openArchive() {
    wx.redirectTo({ url: "/pages/archive/index" });
  },

  createNatal() {
    wx.navigateTo({ url: "/pages/chart-form/index" });
  }
});
