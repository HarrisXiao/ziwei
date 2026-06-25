const api = require("../../utils/api");

const GATEWAY_META = {
  daily: {
    title: "今日运势",
    subtitle: "今日建议",
    icon: "/assets/icon-daily.svg",
    path: "/pages/daily/index"
  },
  annual: {
    title: "年度运势",
    subtitle: "流年趋势",
    icon: "/assets/icon-annual.svg",
    path: "/pages/annual/index"
  },
  relationship: {
    title: "关系合盘",
    subtitle: "缘分协同",
    icon: "/assets/icon-relationship.svg",
    path: "/pages/relationship/index"
  },
  archive: {
    title: "我的档案",
    subtitle: "固定主盘",
    icon: "/assets/icon-archive.svg",
    path: "/pages/archive/index"
  }
};

Page({
  data: {
    ownerReady: false,
    owner: null,
    hero: null,
    gateways: [],
    updates: [],
    rituals: null,
    recentRecords: [],
    loading: true
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [data, profile] = await Promise.all([api.getHome(), api.getProfile()]);
      this.setData({
        ownerReady: Boolean(data.ownerReady),
        owner: profile.owner || null,
        hero: data.hero,
        gateways: (data.gateways || []).map((item) => Object.assign({}, item, GATEWAY_META[item.key] || {})),
        updates: data.updates,
        rituals: data.rituals,
        recentRecords: data.recentRecords || [],
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: "首页加载失败", icon: "none" });
    }
  },

  openGateway(event) {
    const { path } = event.currentTarget.dataset;
    wx.redirectTo({ url: path });
  },

  openRecord(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/interpretation/index?id=${id}` });
  },

  createOwnerProfile() {
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

  openArchive() {
    wx.redirectTo({ url: "/pages/archive/index" });
  }
});
