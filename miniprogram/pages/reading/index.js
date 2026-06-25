const api = require("../../utils/api");

Page({
  data: {
    record: null,
    featuredPalaces: [],
    chartGrid: [],
    loading: true
  },

  onLoad(options) {
    this.loadRecord(options.id, options.mock === "1");
  },

  async loadRecord(id, isMock) {
    if (isMock && getApp().globalData.currentRecord) {
      this.setRecord(getApp().globalData.currentRecord);
      return;
    }

    if (!id && getApp().globalData.currentRecord) {
      this.setRecord(getApp().globalData.currentRecord);
      return;
    }

    try {
      this.setRecord((await api.getChart(id)).record);
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: "命盘加载失败", icon: "none" });
    }
  },

  setRecord(record) {
    const normalized = this.normalizeRecord(record);
    this.setData({
      record: normalized,
      featuredPalaces: normalized.palaces.slice(0, 4),
      chartGrid: normalized.palaces,
      loading: false
    });
  },

  normalizeRecord(record) {
    return Object.assign({}, record, {
      metrics: record.metrics || [],
      highlights: record.highlights || [],
      rituals: record.rituals || { good: [], bad: [] },
      palaces: (record.palaces || []).map((item) =>
        Object.assign({}, item, {
          starsText: (item.stars || []).join(" • ")
        })
      )
    });
  },

  openArchive() {
    wx.redirectTo({ url: "/pages/archive/index" });
  },

  createNew() {
    wx.navigateTo({ url: "/pages/chart-form/index" });
  },

  backHome() {
    wx.redirectTo({ url: "/pages/home/index" });
  }
});
