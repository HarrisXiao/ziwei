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
    form: {
      name: "",
      birthDate: "1994-10-14",
      calendarType: "solar",
      gender: "female",
      hourBranch: "wu",
      mode: "relationship"
    },
    submitting: false,
    errorMessage: "",
    hourCarousel: [],
    hourRangeText: HOUR_RANGES.wu
  },

  onShow() {
    this.loadOwner();
    this.syncHourCarousel(this.data.form.hourBranch);
  },

  async loadOwner() {
    try {
      const data = await api.getProfile();
      this.setData({ owner: data.owner || null });
    } catch (error) {
      this.setData({ owner: null, errorMessage: "主档案加载失败" });
    }
  },

  setName(event) {
    this.setData({ "form.name": event.detail.value, errorMessage: "" });
  },

  setBirthDate(event) {
    this.setData({ "form.birthDate": event.detail.value, errorMessage: "" });
  },

  pickCalendar(event) {
    this.setData({ "form.calendarType": event.currentTarget.dataset.value });
  },

  pickGender(event) {
    this.setData({ "form.gender": event.currentTarget.dataset.value });
  },

  pickHour(event) {
    const value = event.currentTarget.dataset.value;
    this.setData({
      "form.hourBranch": value,
      hourRangeText: HOUR_RANGES[value] || ""
    });
    this.syncHourCarousel(value);
  },

  syncHourCarousel(value) {
    const currentIndex = HOUR_OPTIONS.findIndex((item) => item.value === value);
    const around = [-2, -1, 0, 1, 2].map((offset) => {
      const option = HOUR_OPTIONS[(currentIndex + offset + HOUR_OPTIONS.length) % HOUR_OPTIONS.length];
      return {
        value: option.value,
        label: option.label,
        active: offset === 0,
        mutedLevel: Math.abs(offset)
      };
    });
    this.setData({ hourCarousel: around });
  },

  async submit() {
    const { form, submitting, owner } = this.data;
    if (submitting) {
      return;
    }
    if (!owner) {
      wx.showToast({ title: "请先创建本命盘", icon: "none" });
      return;
    }
    if (!form.name.trim()) {
      wx.showToast({ title: "请输入对方姓名", icon: "none" });
      return;
    }

    this.setData({ submitting: true, errorMessage: "" });
    wx.showLoading({ title: "生成关系合盘中" });
    try {
      const result = await api.createChart(form);
      getApp().globalData.currentRecord = result.record;
      wx.navigateTo({ url: `/pages/interpretation/index?id=${result.record.id}` });
    } catch (error) {
      this.setData({
        errorMessage: error && error.message ? error.message : "关系合盘服务暂时不可用，请稍后重试"
      });
      wx.showToast({ title: "关系合盘生成失败", icon: "none" });
    } finally {
      wx.hideLoading();
      this.setData({ submitting: false });
    }
  },

  useTemplate(event) {
    const gender = event.currentTarget.dataset.gender;
    const nextForm = {
      name: gender === "female" ? "关系示例用户" : "关系示例用户",
      birthDate: gender === "female" ? "1994-10-14" : "1988-10-14",
      calendarType: "solar",
      gender,
      hourBranch: gender === "female" ? "wu" : "chen",
      mode: "relationship"
    };
    this.setData({
      form: nextForm,
      hourRangeText: HOUR_RANGES[nextForm.hourBranch] || ""
    });
    this.syncHourCarousel(nextForm.hourBranch);
  },

  backHome() {
    wx.navigateBack({
      fail: () => {
        wx.redirectTo({ url: "/pages/home/index" });
      }
    });
  },

  openDaily() {
    wx.redirectTo({ url: "/pages/daily/index" });
  },

  openAnnual() {
    wx.redirectTo({ url: "/pages/annual/index" });
  },

  openInterpretation() {
    wx.navigateTo({ url: "/pages/interpretation/index" });
  },

  openArchive() {
    wx.redirectTo({ url: "/pages/archive/index" });
  },

  createNatal() {
    wx.navigateTo({ url: "/pages/chart-form/index" });
  }
});
