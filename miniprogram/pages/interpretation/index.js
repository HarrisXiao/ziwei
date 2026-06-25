const api = require("../../utils/api");

Page({
  data: {
    record: null,
    featuredPalaces: [],
    chartGrid: [],
    modeUi: {},
    loading: true
  },

  onShow() {
    if (!this.data.record && getApp().globalData.currentRecord) {
      this.setRecord(getApp().globalData.currentRecord);
    }
  },

  onLoad(options) {
    this.loadRecord(options.id);
  },

  async loadRecord(id) {
    if (!id && getApp().globalData.currentRecord) {
      this.setRecord(getApp().globalData.currentRecord);
      return;
    }

    if (!id) {
      this.setData({ loading: false });
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
    const featuredPalaces = this.pickFeaturedPalaces(normalized);
    const modeUi = this.getModeUi(normalized);
    getApp().globalData.currentRecord = normalized;
    this.setData({
      record: normalized,
      featuredPalaces,
      chartGrid: normalized.palaces,
      modeUi,
      loading: false
    });
  },

  normalizeRecord(record) {
    return Object.assign({}, record, {
      metrics: record.metrics || [],
      highlights: record.highlights || [],
      rituals: record.rituals || { good: [], bad: [] },
      chartMeta: Object.assign({}, record.chartMeta || {}, {
        relationBasis: (record.chartMeta && record.chartMeta.relationBasis) || [],
        compatibilityEngine: (record.chartMeta && record.chartMeta.compatibilityEngine) || { ruleHits: [], breakdown: {}, llmContext: null, tags: [] }
      }),
      palaces: (record.palaces || []).map((item) =>
        Object.assign({}, item, {
          starsText: (item.stars || []).join(" • ")
        })
      )
    });
  },

  pickFeaturedPalaces(record) {
    const mode = record.mode || "natal";
    const orderMap = {
      natal: ["命宫", "财帛宫", "事业宫", "夫妻宫"],
      annual: ["事业宫", "财帛宫", "迁移宫", "福德宫"],
      relationship: ["夫妻宫", "交友宫", "福德宫", "命宫"]
    };
    const wanted = orderMap[mode] || orderMap.natal;
    const matched = wanted
      .map((title) => (record.palaces || []).find((item) => item.title === title))
      .filter(Boolean);
    return matched.length ? matched : (record.palaces || []).slice(0, 4);
  },

  getModeUi(record) {
    const mode = record.mode || "natal";
    const map = {
      natal: {
        heroTitle: "本命盘解读",
        metricsTitle: "命盘关键指标",
        highlightsTitle: "本命重点",
        chartTitle: "十二宫结构",
        ctaLabel: "再建一份本命记录",
        serviceActionTitle: "继续使用",
        readingTitle: "怎么读这份结果",
        readingSteps: [
          { title: "先看本命重点", content: "先理解你的核心命格和长期底色，不要先陷入单个分值。" },
          { title: "再看关键指标", content: "把命宫、财帛、事业和关系四个方向放在一起理解。" },
          { title: "最后看宫位结构", content: "十二宫适合做补充参考，不必逐格逐条硬读。" }
        ],
        serviceActions: [
          { label: "查看今日运势", path: "/pages/daily/index", primary: true },
          { label: "生成年度运势", path: "/pages/annual/index" },
          { label: "查看我的档案", path: "/pages/archive/index" }
        ]
      },
      annual: {
        heroTitle: "年度运势解读",
        metricsTitle: "年度关键指标",
        highlightsTitle: "年度重点",
        chartTitle: "年度观察宫位",
        ctaLabel: "重新生成年度运势",
        serviceActionTitle: "下一步建议",
        readingTitle: "怎么读这份结果",
        readingSteps: [
          { title: "先看年度重点", content: "先确认这一阶段最值得投入和最需要回避的方向。" },
          { title: "再看关键指标", content: "把事业、财务、机会和心态作为同一组信号来理解。" },
          { title: "最后看宫位变化", content: "宫位更适合辅助判断阶段主题，不必把单项分数当全年结论。" }
        ],
        serviceActions: [
          { label: "回看今日运势", path: "/pages/daily/index", primary: true },
          { label: "发起关系合盘", path: "/pages/relationship/index" },
          { label: "查看我的档案", path: "/pages/archive/index" }
        ]
      },
      relationship: {
        heroTitle: "关系合盘解读",
        metricsTitle: "关系关键指标",
        highlightsTitle: "关系重点",
        chartTitle: "双盘参考宫位",
        ctaLabel: "重新发起关系合盘",
        serviceActionTitle: "下一步建议",
        readingTitle: "怎么读这份结果",
        readingSteps: [
          { title: "先看关系重点", content: "先抓最核心的互动模式和磨合提示，不要急着下结论。" },
          { title: "再看规则分与标签", content: "综合分只是参考，重点看哪些规则命中了你们的互动结构。" },
          { title: "最后再看双盘依据", content: "底层对照适合做验证，不建议拿来替代现实沟通与观察。" }
        ],
        serviceActions: [
          { label: "查看今日运势", path: "/pages/daily/index", primary: true },
          { label: "生成年度运势", path: "/pages/annual/index" },
          { label: "查看我的档案", path: "/pages/archive/index" }
        ]
      }
    };
    return map[mode] || map.natal;
  },

  openArchive() {
    wx.redirectTo({ url: "/pages/archive/index" });
  },

  createNew() {
    const current = this.data.record;
    const mode = current && current.mode ? current.mode : "natal";
    const target = mode === "annual"
      ? "/pages/annual/index"
      : mode === "relationship"
        ? "/pages/relationship/index"
        : "/pages/chart-form/index";
    wx.navigateTo({ url: target });
  },

  backHome() {
    wx.navigateBack({
      fail: () => {
        wx.redirectTo({ url: "/pages/home/index" });
      }
    });
  },

  openServiceAction(event) {
    const { path } = event.currentTarget.dataset;
    if (!path) {
      return;
    }
    wx.navigateTo({ url: path });
  }
});
