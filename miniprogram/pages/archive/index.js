const api = require("../../utils/api");

Page({
  data: {
    profile: null,
    stats: null,
    records: [],
    loading: true
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const data = await api.getRecords();
      this.setData({
        profile: data.profile,
        stats: data.stats,
        records: data.records,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: "档案加载失败", icon: "none" });
    }
  },

  openRecord(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/interpretation/index?id=${id}` });
  },

  createNatal() {
    wx.navigateTo({ url: "/pages/chart-form/index" });
  },

  openDaily() {
    wx.redirectTo({ url: "/pages/daily/index" });
  },

  openAnnual() {
    wx.redirectTo({ url: "/pages/annual/index" });
  },

  openRelationship() {
    wx.navigateTo({ url: "/pages/relationship/index" });
  },

  openOwnerRecord() {
    const { profile } = this.data;
    if (!profile || !profile.id) {
      wx.showToast({ title: "主档案暂不可查看", icon: "none" });
      return;
    }
    wx.navigateTo({ url: `/pages/interpretation/index?id=${profile.id}` });
  },

  backHome() {
    wx.redirectTo({ url: "/pages/home/index" });
  }
});
