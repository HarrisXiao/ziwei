const http = require("http");
const path = require("path");
const { URL } = require("url");
const { astro } = require("iztro");
const packageJson = require("../package.json");
const { createStoreBackend } = require("./storage");

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "../data/store.json");
const DATABASE_URL = process.env.DATABASE_URL || "";
const SERVICE_NAME = "ziwei-api";
const APP_VERSION = process.env.APP_VERSION || packageJson.version;
const NODE_ENV = process.env.NODE_ENV || "development";
const storeBackend = createStoreBackend({
  dataFile: DATA_FILE,
  databaseUrl: DATABASE_URL
});

const HOUR_BRANCHES = {
  zi: "子时",
  chou: "丑时",
  yin: "寅时",
  mao: "卯时",
  chen: "辰时",
  si: "巳时",
  wu: "午时",
  wei: "未时",
  shen: "申时",
  you: "酉时",
  xu: "戌时",
  hai: "亥时"
};

const HOUR_INDEX = {
  zi: 0,
  chou: 1,
  yin: 2,
  mao: 3,
  chen: 4,
  si: 5,
  wu: 6,
  wei: 7,
  shen: 8,
  you: 9,
  xu: 10,
  hai: 11
};

const PALACE_ORDER = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "事业", "田宅", "福德", "父母"];
const PALACE_ALIAS = {
  交友: ["交友", "仆役"],
  事业: ["事业", "官禄"],
  命宫: ["命宫", "命"],
  兄弟: ["兄弟"],
  夫妻: ["夫妻"],
  子女: ["子女"],
  财帛: ["财帛"],
  疾厄: ["疾厄"],
  迁移: ["迁移"],
  田宅: ["田宅"],
  福德: ["福德"],
  父母: ["父母"]
};
const PALACE_SUBTITLE = {
  命宫: "命盘核心",
  兄弟: "手足与协力",
  夫妻: "亲密与伴侣",
  子女: "子女与创作",
  财帛: "财富与资源",
  疾厄: "身心与健康",
  迁移: "外出与变动",
  交友: "人脉与合作",
  事业: "事业与官禄",
  田宅: "家宅与资产",
  福德: "心性与福气",
  父母: "长辈与根基"
};

const THEME_MAP = {
  命宫: "命格主轴",
  兄弟: "协作关系",
  夫妻: "婚恋结构",
  子女: "延展能量",
  财帛: "财富格局",
  疾厄: "身心状态",
  迁移: "环境流转",
  交友: "圈层互动",
  事业: "发展轨迹",
  田宅: "居所根基",
  福德: "精神蓄水",
  父母: "源头支持"
};

const DISPLAY_TITLE_MAP = {
  命宫: "命宫",
  兄弟: "兄弟宫",
  夫妻: "夫妻宫",
  子女: "子女宫",
  财帛: "财帛宫",
  疾厄: "疾厄宫",
  迁移: "迁移宫",
  交友: "交友宫",
  事业: "事业宫",
  田宅: "田宅宫",
  福德: "福德宫",
  父母: "父母宫"
};

const BRIGHTNESS_SCORE = {
  庙: 18,
  旺: 16,
  得: 14,
  利: 12,
  平: 9,
  不: 6,
  陷: 4
};

const ELEMENT_RELATION_SCORE = {
  same: 8,
  generate: 14,
  generatedBy: 10,
  control: -10,
  controlledBy: -6
};

const STAR_COMPATIBILITY = {
  紫微: ["天府", "天相", "太阳", "太阴"],
  天府: ["紫微", "天相", "武曲", "太阴"],
  天相: ["紫微", "天府", "廉贞", "破军"],
  武曲: ["天府", "七杀", "破军", "贪狼"],
  七杀: ["武曲", "破军", "紫微"],
  破军: ["七杀", "武曲", "廉贞", "天相"],
  廉贞: ["天相", "破军", "贪狼"],
  贪狼: ["武曲", "廉贞", "太阴"],
  太阳: ["太阴", "紫微", "天梁"],
  太阴: ["太阳", "天府", "贪狼"],
  天同: ["天梁", "太阴", "天机"],
  天梁: ["天同", "太阳", "紫微"],
  天机: ["天同", "巨门", "太阴"],
  巨门: ["天机", "天梁", "太阴"]
};

const MODE_META = {
  daily: {
    label: "今日运势",
    transitLabel: "今日焦点",
    summaryLead: "今日运势以当日状态与行动节奏为主",
    good: ["优先做一件最重要的事", "结合事业与财帛宫安排节奏", "把精力留给关键关系与关键任务"],
    bad: ["同时推进太多事情", "情绪上头时做决定", "把短期波动放大成长期结论"]
  },
  natal: {
    label: "本命盘",
    transitLabel: "盘面基底",
    summaryLead: "本命盘以命格结构为主",
    good: ["先看命宫、官禄、财帛三宫", "结合大限观察阶段变化", "对照命主与身主理解性格底色"],
    bad: ["脱离出生时辰直接断盘", "只看单宫不看三方四正", "把展示评分视作传统定论"]
  },
  annual: {
    label: "年度运势",
    transitLabel: "流年焦点",
    summaryLead: "年度运势以阶段起伏为主",
    good: ["先看官禄、财帛、迁移三宫", "结合当前大限判断阶段任务", "把握节奏而非只看单点结果"],
    bad: ["把短期波动当作长期趋势", "忽略大限与流年的叠加", "只凭单项分数做重大决策"]
  },
  relationship: {
    label: "关系合盘",
    transitLabel: "关系焦点",
    summaryLead: "关系合盘以互动模式为主",
    good: ["重点看夫妻、交友、福德三宫", "结合沟通方式看关系磨合点", "把盘面当作理解关系的辅助"],
    bad: ["把盘面当作关系结论", "忽略现实沟通与边界", "只看吸引不看长期协同"]
  }
};

async function ensureStore() {
  await storeBackend.ensure();
}

async function readStore() {
  await ensureStore();
  return storeBackend.read();
}

async function writeStore(store) {
  await ensureStore();
  return storeBackend.write(store);
}

async function syncNormalizedStore() {
  const currentStore = await readStore();
  const store = {
    records: Array.isArray(currentStore.records) ? currentStore.records : [],
    ownerProfileId: currentStore.ownerProfileId || ""
  };
  let changed = currentStore.records !== store.records || currentStore.ownerProfileId !== store.ownerProfileId;
  const records = store.records.map((record) => {
    const normalized = normalizeRecord(record);
    if (JSON.stringify(normalized) !== JSON.stringify(record)) {
      changed = true;
      return normalized;
    }
    return record;
  });

  if (changed) {
    const nextStore = { records, ownerProfileId: store.ownerProfileId || "" };
    await writeStore(nextStore);
    return nextStore;
  }

  return store;
}

function getOwnerRecord(store) {
  const ownerId = store.ownerProfileId;
  const records = (store.records || []).map(normalizeRecord);
  const byOwnerId = ownerId ? records.find((item) => item.id === ownerId) : null;
  if (byOwnerId) {
    return byOwnerId;
  }
  return records.find((item) => (item.mode || "natal") === "natal") || null;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function calculatePalaceScore(palace) {
  const majorScore = (palace.majorStars || []).reduce((sum, star) => sum + (BRIGHTNESS_SCORE[star.brightness] || 10), 0);
  const minorScore = Math.min((palace.minorStars || []).length * 3, 12);
  const adjectiveScore = Math.min((palace.adjectiveStars || []).length * 1, 8);
  const total = 55 + majorScore + minorScore + adjectiveScore;
  return Math.max(60, Math.min(98, total));
}

function formatStar(star) {
  if (!star) {
    return "";
  }
  const brightness = star.brightness ? `(${star.brightness})` : "";
  const mutagen = star.mutagen ? `·${star.mutagen}` : "";
  return `${star.name}${brightness}${mutagen}`;
}

function buildPalaceDescription(palace) {
  const majors = (palace.majorStars || []).map((item) => item.name).join("、") || "辅星";
  const minors = (palace.minorStars || []).slice(0, 2).map((item) => item.name).join("、");
  const decadal = palace.decadal && palace.decadal.range ? `${palace.decadal.range[0]}-${palace.decadal.range[1]}岁` : "当前阶段";
  return `${palace.name} 以 ${majors} 为主${minors ? `，并会联动 ${minors}` : ""}。当前宫位对应的大限区间为 ${decadal}，判断时宜结合三方四正与流年四化一起看。`;
}

function getRealChart(payload) {
  const timeIndex = HOUR_INDEX[payload.hourBranch];
  if (timeIndex === undefined) {
    throw new Error("Unsupported hour branch");
  }
  const gender = payload.gender === "female" ? "female" : "male";
  if (payload.calendarType === "lunar") {
    return astro.byLunar(payload.birthDate, timeIndex, gender, true, "zh-CN");
  }
  return astro.bySolar(payload.birthDate, timeIndex, gender, true, "zh-CN");
}

function normalizePalaces(chart) {
  const palaceMap = {};
  (chart.palaces || []).forEach((item) => {
    palaceMap[item.name] = item;
  });

  return PALACE_ORDER.map((name, index) => {
    const aliases = PALACE_ALIAS[name] || [name];
    const palace = aliases.map((alias) => palaceMap[alias] || palaceMap[alias.replace("宫", "")]).find(Boolean);
    if (!palace) {
      return {
        key: `palace-${index}`,
        title: DISPLAY_TITLE_MAP[name] || name,
        subtitle: PALACE_SUBTITLE[name] || `${name} Palace`,
        theme: THEME_MAP[name] || name,
        tag: "盘面",
        score: 60,
        stars: [],
        starsText: "",
        description: `${name} 暂未找到对应盘面数据。`
      };
    }

    const stars = []
      .concat((palace.majorStars || []).map(formatStar))
      .concat((palace.minorStars || []).slice(0, 2).map(formatStar))
      .filter(Boolean);

    return {
      key: name,
      rawTitle: palace.name,
      title: DISPLAY_TITLE_MAP[name] || palace.name,
      subtitle: PALACE_SUBTITLE[palace.name] || `${palace.name} Palace`,
      theme: THEME_MAP[palace.name] || palace.name,
      tag: palace.isBodyPalace ? "身宫" : palace.isOriginalPalace ? "来因宫" : "盘面",
      score: calculatePalaceScore(palace),
      stars,
      starsText: stars.join(" • "),
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      changsheng12: palace.changsheng12,
      boshi12: palace.boshi12,
      jiangqian12: palace.jiangqian12,
      suiqian12: palace.suiqian12,
      decadal: palace.decadal,
      ages: palace.ages,
      description: buildPalaceDescription(palace)
    };
  });
}

function buildMetricsFromPalaces(palaces) {
  const pickScore = (title) => {
    const found = palaces.find((item) => item.title === title);
    return found ? found.score : 70;
  };
  return [
    { label: "事业势能", score: pickScore("事业"), tone: "primary" },
    { label: "财富流动", score: pickScore("财帛"), tone: "secondary" },
    { label: "关系协同", score: pickScore("夫妻"), tone: "tertiary" },
    { label: "身心稳态", score: pickScore("疾厄"), tone: "neutral" }
  ];
}

function buildHighlights(chart, palaces) {
  const soul = palaces.find((item) => item.title === "命宫");
  const wealth = palaces.find((item) => item.title === "财帛");
  const relation = palaces.find((item) => item.title === "夫妻");
  return [
    {
      title: "命宫主轴",
      content: `${chart.soul} 为命主，${chart.body} 为身主。${soul ? `${soul.title} 的主星组合为 ${soul.starsText || "暂无"}。` : ""}`
    },
    {
      title: "财富提示",
      content: wealth
        ? `${wealth.title} 当前星曜为 ${wealth.starsText || "暂无"}，长生十二神为 ${wealth.changsheng12 || "未标注"}。`
        : "当前盘面未取到财帛宫信息。"
    },
    {
      title: "关系提示",
      content: relation
        ? `${relation.title} 的盘面组合为 ${relation.starsText || "暂无"}，适合结合大限和流年进一步判断。`
        : "当前盘面未取到夫妻宫信息。"
    }
  ];
}

function buildMetricsFromChart(chart, palaces) {
  return buildMetricsByMode("natal", palaces);
}

function buildMetricsByMode(modeKey, palaces) {
  const getScore = (title) => {
    const palace = palaces.find((item) => item.title === title);
    return palace ? palace.score : 70;
  };

  if (modeKey === "annual") {
    return [
      { label: "事业起伏", score: getScore("事业宫"), tone: "primary" },
      { label: "财务节奏", score: getScore("财帛宫"), tone: "secondary" },
      { label: "外部变化", score: getScore("迁移宫"), tone: "tertiary" },
      { label: "心态韧性", score: getScore("福德宫"), tone: "neutral" }
    ];
  }

  if (modeKey === "relationship") {
    return [
      { label: "伴侣互动", score: getScore("夫妻宫"), tone: "primary" },
      { label: "社交协同", score: getScore("交友宫"), tone: "secondary" },
      { label: "情绪承载", score: getScore("福德宫"), tone: "tertiary" },
      { label: "边界稳定", score: getScore("命宫"), tone: "neutral" }
    ];
  }

  return [
    { label: "命宫势能", score: getScore("命宫"), tone: "primary" },
    { label: "财帛格局", score: getScore("财帛宫"), tone: "secondary" },
    { label: "官禄格局", score: getScore("事业宫"), tone: "tertiary" },
    { label: "夫妻结构", score: getScore("夫妻宫"), tone: "neutral" }
  ];
}

function buildSummary(chart, palaces, modeKey) {
  const soulPalace = palaces.find((item) => item.title === "命宫");
  const careerPalace = palaces.find((item) => item.title === "事业宫");
  const wealthPalace = palaces.find((item) => item.title === "财帛宫");
  const mode = MODE_META[modeKey] || MODE_META.natal;
  return `${mode.summaryLead}。${chart.soul} 为命主，${chart.body} 为身主，${chart.fiveElementsClass}。命宫主星 ${soulPalace && soulPalace.starsText ? soulPalace.starsText : "待解析"}；官禄宫 ${careerPalace && careerPalace.starsText ? careerPalace.starsText : "待解析"}；财帛宫 ${wealthPalace && wealthPalace.starsText ? wealthPalace.starsText : "待解析"}。`;
}

function buildProfessionalHighlights(chart, palaces) {
  const soulPalace = palaces.find((item) => item.title === "命宫");
  const careerPalace = palaces.find((item) => item.title === "事业宫");
  const wealthPalace = palaces.find((item) => item.title === "财帛宫");
  const relationPalace = palaces.find((item) => item.title === "夫妻宫");
  const travelPalace = palaces.find((item) => item.title === "迁移宫");
  const socialPalace = palaces.find((item) => item.title === "交友宫");
  const spiritPalace = palaces.find((item) => item.title === "福德宫");

  if (chart.analysisMode === "annual") {
    return [
      {
        title: "年度主轴",
        content: `本阶段以 ${careerPalace && careerPalace.starsText ? careerPalace.starsText : "官禄宫待解析"} 与 ${wealthPalace && wealthPalace.starsText ? wealthPalace.starsText : "财帛宫待解析"} 为重点。适合把年度节奏放在事业推进与资源配置上。`
      },
      {
        title: "外部变化",
        content: `迁移宫 ${travelPalace && travelPalace.starsText ? travelPalace.starsText : "暂无主星"}。这一年更适合关注环境切换、合作变动与外部机会。`
      },
      {
        title: "阶段提醒",
        content: `福德宫 ${spiritPalace && spiritPalace.starsText ? spiritPalace.starsText : "暂无主星"}。做年度规划时，应把节奏、休整与持续性放在重要位置。`
      }
    ];
  }

  if (chart.analysisMode === "relationship") {
    return [
      {
        title: "关系底色",
        content: `夫妻宫 ${relationPalace && relationPalace.starsText ? relationPalace.starsText : "暂无主星"}。它反映出关系中的期待、互动方式与磨合重点。`
      },
      {
        title: "协同方式",
        content: `交友宫 ${socialPalace && socialPalace.starsText ? socialPalace.starsText : "暂无主星"}。这部分更适合用来观察合作边界、社交节奏与彼此支持方式。`
      },
      {
        title: "情绪承载",
        content: `福德宫 ${spiritPalace && spiritPalace.starsText ? spiritPalace.starsText : "暂无主星"}。若要看长期相处，除了吸引，还要关注情绪容纳与精神消耗。`
      }
    ];
  }

  return [
    {
      title: "命盘基础",
      content: `命主 ${chart.soul}，身主 ${chart.body}，五行局 ${chart.fiveElementsClass}。命宫位于 ${soulPalace ? `${soulPalace.heavenlyStem}${soulPalace.earthlyBranch}` : "未定位"}。`
    },
    {
      title: "官禄与财帛",
      content: `官禄宫 ${careerPalace && careerPalace.starsText ? careerPalace.starsText : "暂无主星"}；财帛宫 ${wealthPalace && wealthPalace.starsText ? wealthPalace.starsText : "暂无主星"}。建议结合大限与流年再做职业和财务判断。`
    },
    {
      title: "夫妻与人际",
      content: `夫妻宫 ${relationPalace && relationPalace.starsText ? relationPalace.starsText : "暂无主星"}。若需进一步判断婚恋与合作关系，建议继续引入流年四化。`
    }
  ];
}

function buildRecordFromChart(payload, chart) {
  const palaces = normalizePalaces(chart);
  chart.analysisMode = payload.mode || "natal";
  const metrics = buildMetricsByMode(chart.analysisMode, palaces);
  const mode = MODE_META[payload.mode] || MODE_META.natal;
  const mainPalace = palaces.find((item) => item.title === "命宫") || palaces[0];
  const mainStar = mainPalace && mainPalace.stars[0] ? mainPalace.stars[0].split("(")[0] : chart.soul;
  const supportStar = mainPalace && mainPalace.stars[1] ? mainPalace.stars[1].split("(")[0] : chart.body;
  const luckScore = Math.round(metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length);

  return {
    id: `chart-${Date.now()}`,
    name: String(payload.name).trim(),
    birthDate: payload.birthDate,
    calendarType: payload.calendarType || "solar",
    gender: payload.gender,
    hourBranch: payload.hourBranch,
    mode: payload.mode || "natal",
    hourLabel: HOUR_BRANCHES[payload.hourBranch] || chart.time,
    createdAt: new Date().toISOString(),
    mainStar,
    supportStar,
    luckScore,
    dailyElement: chart.fiveElementsClass,
    lifeElement: chart.fiveElementsClass,
    celestialStem: chart.earthlyBranchOfSoulPalace,
    quote: `${chart.solarDate} · ${chart.lunarDate} · ${chart.timeRange}`,
    summary: buildSummary(chart, palaces, payload.mode || "natal"),
    transit: {
      label: mode.transitLabel,
      value: `${chart.sign} · 生肖${chart.zodiac}`,
      insight: `阳历 ${chart.solarDate}，农历 ${chart.lunarDate}，出生时段 ${chart.timeRange}。当前结果用于${mode.label}分析，数据来自真实紫微斗数排盘。`
    },
    metrics,
    highlights: buildProfessionalHighlights(chart, palaces),
    rituals: {
      good: mode.good,
      bad: mode.bad
    },
    chartMeta: {
      solarDate: chart.solarDate,
      lunarDate: chart.lunarDate,
      chineseDate: chart.chineseDate,
      time: chart.time,
      timeRange: chart.timeRange,
      sign: chart.sign,
      zodiac: chart.zodiac,
      soul: chart.soul,
      body: chart.body,
      fiveElementsClass: chart.fiveElementsClass,
      modeLabel: mode.label
    },
    palaces
  };
}

function getDateSeed(input) {
  return String(input || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function buildDailyPayload(store) {
  const owner = getOwnerRecord(store);
  if (!owner || !owner.chartMeta) {
    return {
      hasOwner: false,
      title: "先创建你的本命盘",
      subtitle: "今日运势",
      description: "首次使用请先完成本命盘创建，系统会自动把它固定为你的主档案，后续今日运势与年度运势都基于这份盘。",
      metrics: [],
      good: [],
      bad: [],
      highlights: []
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const seed = getDateSeed(`${owner.id}-${today}`);
  const careerPalace = owner.palaces.find((item) => item.title === "事业宫");
  const wealthPalace = owner.palaces.find((item) => item.title === "财帛宫");
  const relationPalace = owner.palaces.find((item) => item.title === "夫妻宫");
  const spiritPalace = owner.palaces.find((item) => item.title === "福德宫");
  const overall = 68 + (seed % 27);
  const work = Math.max(60, Math.min(98, (careerPalace ? careerPalace.score : 75) - 8 + (seed % 15)));
  const wealth = Math.max(60, Math.min(98, (wealthPalace ? wealthPalace.score : 75) - 6 + ((seed + 3) % 13)));
  const relation = Math.max(60, Math.min(98, (relationPalace ? relationPalace.score : 75) - 10 + ((seed + 5) % 17)));
  const energy = Math.max(60, Math.min(98, (spiritPalace ? spiritPalace.score : 75) - 9 + ((seed + 7) % 16)));

  return {
    hasOwner: true,
    ownerName: owner.name,
    ownerId: owner.id,
    title: "今日运势",
    subtitle: today,
    description: `${owner.name} 的今日运势基于已固定主档案生成。命主 ${owner.chartMeta.soul}，身主 ${owner.chartMeta.body}，更适合围绕当日重点而不是全面铺开。`,
    metrics: [
      { label: "综合状态", score: overall },
      { label: "事业推进", score: work },
      { label: "财务节奏", score: wealth },
      { label: "关系互动", score: relation },
      { label: "心态能量", score: energy }
    ],
    good: [
      `优先处理${careerPalace ? careerPalace.title : "事业事项"}相关任务`,
      `把资源投入到${wealthPalace ? wealthPalace.title : "财务规划"}更容易看到回报`,
      "今天适合少而精地推进关键事项"
    ],
    bad: [
      "不建议临时推翻既定安排",
      "避免情绪化回复和临场加码",
      "不要把今天的波动放大成长期判断"
    ],
    highlights: [
      {
        title: "今日主线",
        content: `${careerPalace ? `${careerPalace.title} ${careerPalace.starsText || "待解析"}` : "事业宫待解析"}，适合以执行和推进为先。`
      },
      {
        title: "资源流向",
        content: `${wealthPalace ? `${wealthPalace.title} ${wealthPalace.starsText || "待解析"}` : "财帛宫待解析"}，今天更适合做结构化配置。`
      },
      {
        title: "关系提醒",
        content: `${relationPalace ? `${relationPalace.title} ${relationPalace.starsText || "待解析"}` : "夫妻宫待解析"}，沟通宜留余地。`
      }
    ]
  };
}

function buildRelationBasisItem(label, ownerName, ownerPalace, counterpartName, counterpartPalace, focus) {
  const ownerStars = ownerPalace && ownerPalace.starsText ? ownerPalace.starsText : "待解析";
  const counterpartStars = counterpartPalace && counterpartPalace.starsText ? counterpartPalace.starsText : "待解析";
  const ownerScore = ownerPalace ? ownerPalace.score : 70;
  const counterpartScore = counterpartPalace ? counterpartPalace.score : 70;
  return {
    label,
    focus,
    owner: {
      name: ownerName,
      palace: ownerPalace ? ownerPalace.title : "未取到宫位",
      branch: ownerPalace ? `${ownerPalace.heavenlyStem || ""}${ownerPalace.earthlyBranch || ""}` : "",
      starsText: ownerStars,
      score: ownerScore
    },
    counterpart: {
      name: counterpartName,
      palace: counterpartPalace ? counterpartPalace.title : "未取到宫位",
      branch: counterpartPalace ? `${counterpartPalace.heavenlyStem || ""}${counterpartPalace.earthlyBranch || ""}` : "",
      starsText: counterpartStars,
      score: counterpartScore
    },
    delta: Math.abs(ownerScore - counterpartScore)
  };
}

function getFiveElementLabel(value) {
  return String(value || "").trim().charAt(0) || "";
}

function getElementRelation(source, target) {
  const map = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  if (!source || !target) {
    return { key: "unknown", score: 0, text: "五行局信息不足" };
  }
  if (source === target) {
    return { key: "same", score: ELEMENT_RELATION_SCORE.same, text: "双方五行同局，节奏相近" };
  }
  if (map[source] === target) {
    return { key: "generate", score: ELEMENT_RELATION_SCORE.generate, text: `${source}生${target}，一方更容易滋养另一方` };
  }
  if (map[target] === source) {
    return { key: "generatedBy", score: ELEMENT_RELATION_SCORE.generatedBy, text: `${target}生${source}，双方有互补基础` };
  }
  const controlMap = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
  if (controlMap[source] === target) {
    return { key: "control", score: ELEMENT_RELATION_SCORE.control, text: `${source}克${target}，相处中容易有压制感` };
  }
  if (controlMap[target] === source) {
    return { key: "controlledBy", score: ELEMENT_RELATION_SCORE.controlledBy, text: `${target}克${source}，磨合时要注意边界` };
  }
  return { key: "unknown", score: 0, text: "五行关系未命中预设规则" };
}

function getRawPalace(chart, name) {
  const aliases = PALACE_ALIAS[name] || [name];
  return aliases
    .map((alias) => (chart.palaces || []).find((item) => item.name === alias || item.name === alias.replace("宫", "")))
    .find(Boolean) || null;
}

function getMajorStarNames(palace) {
  return (palace && palace.majorStars ? palace.majorStars : []).map((item) => item.name);
}

function palaceHasStar(palace, starName) {
  if (!palace || !starName) {
    return false;
  }
  return []
    .concat(palace.majorStars || [])
    .concat(palace.minorStars || [])
    .concat(palace.adjectiveStars || [])
    .some((item) => item.name === starName);
}

function getTargetPalaceMatches(chart, targetNames, starName) {
  return targetNames
    .map((targetName) => getRawPalace(chart, targetName))
    .filter(Boolean)
    .filter((palace) => palaceHasStar(palace, starName))
    .map((palace) => ({
      name: palace.name,
      stem: palace.heavenlyStem,
      branch: palace.earthlyBranch
    }));
}

function getMutagenHitScore(mutagen, palaceName) {
  const palaceWeight = palaceName === "夫妻" ? 1 : palaceName === "命宫" ? 0.9 : 0.7;
  const base = mutagen === "禄" ? 14 : mutagen === "权" ? 8 : mutagen === "科" ? 6 : mutagen === "忌" ? -16 : 0;
  return Math.round(base * palaceWeight);
}

function dedupeRuleHits(ruleHits) {
  const bucket = new Map();
  ruleHits.forEach((item) => {
    const key = `${item.rule}|${item.title}|${item.evidence}`;
    const prev = bucket.get(key);
    if (!prev || Math.abs(item.score) > Math.abs(prev.score)) {
      bucket.set(key, item);
    }
  });
  return Array.from(bucket.values());
}

function getCompatibilityTags(finalScore, breakdown) {
  const tags = [];
  if (finalScore >= 82) {
    tags.push("高契合");
  } else if (finalScore >= 70) {
    tags.push("可发展");
  } else {
    tags.push("需磨合");
  }
  if ((breakdown.mutagen || 0) <= -10) {
    tags.push("情绪敏感");
  }
  if ((breakdown.star || 0) >= 18) {
    tags.push("主星呼应");
  }
  if ((breakdown.element || 0) >= 10) {
    tags.push("五行互补");
  }
  return tags;
}

function getAllMutagenStars(chart) {
  const hits = [];
  (chart.palaces || []).forEach((palace) => {
    []
      .concat(palace.majorStars || [])
      .concat(palace.minorStars || [])
      .concat(palace.adjectiveStars || [])
      .forEach((star) => {
        if (star.mutagen) {
          hits.push({
            palaceName: palace.name,
            palaceStem: palace.heavenlyStem,
            palaceBranch: palace.earthlyBranch,
            starName: star.name,
            mutagen: star.mutagen
          });
        }
      });
  });
  return hits;
}

function buildCompatibilityEngine(ownerRecord, counterpartRecord, ownerChart, counterpartChart) {
  const ownerRaw = {
    spouse: getRawPalace(ownerChart, "夫妻"),
    life: getRawPalace(ownerChart, "命宫"),
    social: getRawPalace(ownerChart, "交友"),
    spirit: getRawPalace(ownerChart, "福德")
  };
  const counterpartRaw = {
    spouse: getRawPalace(counterpartChart, "夫妻"),
    life: getRawPalace(counterpartChart, "命宫"),
    social: getRawPalace(counterpartChart, "交友"),
    spirit: getRawPalace(counterpartChart, "福德")
  };

  const ownerSpouseStars = getMajorStarNames(ownerRaw.spouse);
  const counterpartSpouseStars = getMajorStarNames(counterpartRaw.spouse);
  const ownerLifeStars = getMajorStarNames(ownerRaw.life);
  const counterpartLifeStars = getMajorStarNames(counterpartRaw.life);

  const starHits = [];
  ownerSpouseStars.forEach((star) => {
    if (counterpartLifeStars.includes(star) || counterpartSpouseStars.includes(star)) {
      starHits.push({
        rule: "star_same",
        score: 18,
        title: "主星同曜互见",
        evidence: `${ownerRecord.name}夫妻宫主星 ${star} 与 ${counterpartRecord.name} 命宫/夫妻宫出现同曜`
      });
      return;
    }
    const matched = (STAR_COMPATIBILITY[star] || []).find((item) => counterpartLifeStars.includes(item) || counterpartSpouseStars.includes(item));
    if (matched) {
      starHits.push({
        rule: "star_pair",
        score: 12,
        title: "主星互补组合",
        evidence: `${ownerRecord.name}夫妻宫主星 ${star} 与 ${counterpartRecord.name} 命宫/夫妻宫主星 ${matched} 命中互补组合`
      });
    }
  });

  counterpartSpouseStars.forEach((star) => {
    const matched = (STAR_COMPATIBILITY[star] || []).find((item) => ownerLifeStars.includes(item) || ownerSpouseStars.includes(item));
    if (matched) {
      starHits.push({
        rule: "star_pair_reverse",
        score: 8,
        title: "反向互看呼应",
        evidence: `${counterpartRecord.name}夫妻宫主星 ${star} 与 ${ownerRecord.name} 命宫/夫妻宫主星 ${matched} 形成反向呼应`
      });
    }
  });

  const ownerElement = getFiveElementLabel(ownerRecord.chartMeta && ownerRecord.chartMeta.fiveElementsClass);
  const counterpartElement = getFiveElementLabel(counterpartRecord.chartMeta && counterpartRecord.chartMeta.fiveElementsClass);
  const elementRelation = getElementRelation(ownerElement, counterpartElement);
  const elementHit = {
    rule: `element_${elementRelation.key}`,
    score: elementRelation.score,
    title: "五行局关系",
    evidence: `${ownerRecord.name}${ownerRecord.chartMeta.fiveElementsClass}；${counterpartRecord.name}${counterpartRecord.chartMeta.fiveElementsClass}。${elementRelation.text}`
  };

  const ownerMutagens = getAllMutagenStars(ownerChart);
  const counterpartMutagens = getAllMutagenStars(counterpartChart);
  const ownerTargetPalaces = ["命宫", "夫妻"];
  const counterpartTargetPalaces = ["命宫", "夫妻"];
  const mutagenHits = [];

  ownerMutagens.forEach((item) => {
    const matches = getTargetPalaceMatches(counterpartChart, counterpartTargetPalaces, item.starName);
    matches.forEach((match) => {
      if (item.mutagen === "禄" || item.mutagen === "权" || item.mutagen === "科") {
        mutagenHits.push({
          rule: `owner_${item.mutagen}_to_counterpart_${match.name}`,
          score: getMutagenHitScore(item.mutagen, match.name),
          title: `你方化${item.mutagen}命中对方${match.name}`,
          evidence: `${ownerRecord.name}盘中 ${item.starName} 化${item.mutagen}，并命中 ${counterpartRecord.name}${match.name}（${match.stem}${match.branch}）`
        });
      }
      if (item.mutagen === "忌") {
        mutagenHits.push({
          rule: `owner_ji_to_counterpart_${match.name}`,
          score: getMutagenHitScore(item.mutagen, match.name),
          title: `你方化忌命中对方${match.name}`,
          evidence: `${ownerRecord.name}盘中 ${item.starName} 化忌，并命中 ${counterpartRecord.name}${match.name}（${match.stem}${match.branch}），关系推进时容易触发敏感点`
        });
      }
    });
  });

  counterpartMutagens.forEach((item) => {
    const matches = getTargetPalaceMatches(ownerChart, ownerTargetPalaces, item.starName);
    matches.forEach((match) => {
      if (item.mutagen === "禄" || item.mutagen === "权" || item.mutagen === "科") {
        mutagenHits.push({
          rule: `counterpart_${item.mutagen}_to_owner_${match.name}`,
          score: getMutagenHitScore(item.mutagen, match.name),
          title: `对方化${item.mutagen}命中你方${match.name}`,
          evidence: `${counterpartRecord.name}盘中 ${item.starName} 化${item.mutagen}，并命中 ${ownerRecord.name}${match.name}（${match.stem}${match.branch}）`
        });
      }
      if (item.mutagen === "忌") {
        mutagenHits.push({
          rule: `counterpart_ji_to_owner_${match.name}`,
          score: getMutagenHitScore(item.mutagen, match.name),
          title: `对方化忌命中你方${match.name}`,
          evidence: `${counterpartRecord.name}盘中 ${item.starName} 化忌，并命中 ${ownerRecord.name}${match.name}（${match.stem}${match.branch}），关系推进时要注意消耗`
        });
      }
    });
  });

  const ruleHits = dedupeRuleHits([]
    .concat(starHits)
    .concat([elementHit])
    .concat(mutagenHits)
  ).sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

  const baseScore = 60;
  const rawScore = ruleHits.reduce((sum, item) => sum + item.score, baseScore);
  const finalScore = Math.max(35, Math.min(95, rawScore));
  const breakdown = {
    star: starHits.reduce((sum, item) => sum + item.score, 0),
    element: elementHit.score,
    mutagen: mutagenHits.reduce((sum, item) => sum + item.score, 0)
  };
  const tags = getCompatibilityTags(finalScore, breakdown);
  const factualSummary = [
    `综合分 ${finalScore}`,
    `主星互看 ${breakdown.star}`,
    `五行局 ${breakdown.element}`,
    `四化影响 ${breakdown.mutagen}`
  ];

  return {
    version: "compat-v2",
    baseScore,
    finalScore,
    ruleHits,
    breakdown,
    tags,
    llmContext: {
      type: "relationship_translation_input",
      engineVersion: "compat-v2",
      score: finalScore,
      tags,
      factualSummary,
      starHits: starHits.map((item) => item.evidence),
      elementHit: elementHit.evidence,
      mutagenHits: mutagenHits.map((item) => item.evidence),
      topRules: ruleHits.slice(0, 5).map((item) => ({
        title: item.title,
        score: item.score,
        evidence: item.evidence
      })),
      caution: "只能基于这些命中规则做语言翻译，不得新增命理事实，不得改写吉凶方向，不得补充未命中的命理判断。"
    }
  };
}

function buildRelationshipRecordFromCharts(owner, counterpartPayload, counterpartChart) {
  const ownerChart = getRealChart({
    birthDate: owner.birthDate,
    calendarType: owner.calendarType || "solar",
    gender: owner.gender,
    hourBranch: owner.hourBranch
  });
  const counterpart = buildRecordFromChart(
    {
      name: counterpartPayload.name,
      birthDate: counterpartPayload.birthDate,
      calendarType: counterpartPayload.calendarType || "solar",
      gender: counterpartPayload.gender,
      hourBranch: counterpartPayload.hourBranch,
      mode: "natal"
    },
    counterpartChart
  );
  const compatibilityEngine = buildCompatibilityEngine(owner, counterpart, ownerChart, counterpartChart);

  const ownerRelation = (owner.palaces || []).find((item) => item.title === "夫妻宫");
  const counterpartRelation = (counterpart.palaces || []).find((item) => item.title === "夫妻宫");
  const ownerLife = (owner.palaces || []).find((item) => item.title === "命宫");
  const counterpartLife = (counterpart.palaces || []).find((item) => item.title === "命宫");
  const ownerSocial = (owner.palaces || []).find((item) => item.title === "交友宫");
  const counterpartSocial = (counterpart.palaces || []).find((item) => item.title === "交友宫");
  const ownerSpirit = (owner.palaces || []).find((item) => item.title === "福德宫");
  const counterpartSpirit = (counterpart.palaces || []).find((item) => item.title === "福德宫");
  const sharedStars = (ownerRelation && counterpartRelation)
    ? ownerRelation.stars.filter((star) => counterpartRelation.stars.includes(star))
    : [];
  const palaceAverages = [
    Math.round(((ownerRelation ? ownerRelation.score : 75) + (counterpartRelation ? counterpartRelation.score : 75)) / 2),
    Math.round(((ownerSocial ? ownerSocial.score : 75) + (counterpartSocial ? counterpartSocial.score : 75)) / 2),
    Math.round(((ownerSpirit ? ownerSpirit.score : 75) + (counterpartSpirit ? counterpartSpirit.score : 75)) / 2),
    Math.round(((ownerLife ? ownerLife.score : 75) + (counterpartLife ? counterpartLife.score : 75)) / 2)
  ];
  const compatibilityBase = Math.round(palaceAverages.reduce((sum, item) => sum + item, 0) / palaceAverages.length);
  const contrastSignals = [];
  if (ownerRelation && counterpartLife) {
    contrastSignals.push(`你方夫妻宫对照对方命宫：${ownerRelation.starsText || "待解析"} × ${counterpartLife.starsText || "待解析"}`);
  }
  if (counterpartRelation && ownerLife) {
    contrastSignals.push(`对方夫妻宫对照你方命宫：${counterpartRelation.starsText || "待解析"} × ${ownerLife.starsText || "待解析"}`);
  }
  if (ownerSpirit && counterpartSpirit) {
    contrastSignals.push(`双方福德宫：${ownerSpirit.starsText || "待解析"} / ${counterpartSpirit.starsText || "待解析"}`);
  }
  const relationBasis = [
    buildRelationBasisItem("夫妻宫对照", owner.name, ownerRelation, counterpart.name, counterpartRelation, "观察双方对亲密关系的期待与互动方式"),
    buildRelationBasisItem("命宫对照", owner.name, ownerLife, counterpart.name, counterpartLife, "观察双方底层气质、性格主轴与自我呈现"),
    buildRelationBasisItem("交友宫对照", owner.name, ownerSocial, counterpart.name, counterpartSocial, "观察彼此在人际、合作与支持方式上的匹配度"),
    buildRelationBasisItem("福德宫对照", owner.name, ownerSpirit, counterpart.name, counterpartSpirit, "观察情绪承载、精神节奏与长期相处压力")
  ];

  return {
    id: `chart-${Date.now()}`,
    name: `${owner.name} × ${counterpart.name}`,
    birthDate: counterpart.birthDate,
    calendarType: counterpart.calendarType,
    gender: counterpart.gender,
    hourBranch: counterpart.hourBranch,
    mode: "relationship",
    hourLabel: `${owner.hourLabel} / ${counterpart.hourLabel}`,
    createdAt: new Date().toISOString(),
    mainStar: owner.chartMeta.soul,
    supportStar: counterpart.chartMeta.soul,
    luckScore: compatibilityEngine.finalScore,
    dailyElement: `${owner.lifeElement} / ${counterpart.lifeElement}`,
    lifeElement: `${owner.lifeElement} / ${counterpart.lifeElement}`,
    celestialStem: `${owner.celestialStem} / ${counterpart.celestialStem}`,
    quote: `${owner.name} · ${counterpart.name} · 合盘对照`,
    summary: `${owner.name} 与 ${counterpart.name} 的关系结果基于双方真实命盘做结构对照。当前引擎版本 ${compatibilityEngine.version}，综合分 ${compatibilityEngine.finalScore}，标签 ${compatibilityEngine.tags.join(" / ")}。你方命主 ${owner.chartMeta.soul}、对方命主 ${counterpart.chartMeta.soul}，重点参考夫妻宫、命宫、交友宫、福德宫，以及主星互看、五行局生克、四化命中。`,
    transit: {
      label: "关系焦点",
      value: `${owner.chartMeta.soul} × ${counterpart.chartMeta.soul}`,
      insight: `本次关系合盘以你 ${owner.name} 的固定主档案为基准，并结合对方 ${counterpart.name} 的真实排盘结果进行结构化对照。`
    },
    metrics: [
      { label: "合盘综合", score: compatibilityEngine.finalScore, tone: "primary" },
      { label: "主星互看", score: Math.max(35, Math.min(95, 60 + compatibilityEngine.breakdown.star)), tone: "secondary" },
      { label: "五行局关系", score: Math.max(35, Math.min(95, 60 + compatibilityEngine.breakdown.element)), tone: "tertiary" },
      { label: "四化影响", score: Math.max(35, Math.min(95, 60 + compatibilityEngine.breakdown.mutagen)), tone: "neutral" }
    ],
    highlights: [
      {
        title: "对照基础",
        content: `你方夫妻宫 ${ownerRelation && ownerRelation.starsText ? ownerRelation.starsText : "待解析"}；对方夫妻宫 ${counterpartRelation && counterpartRelation.starsText ? counterpartRelation.starsText : "待解析"}。这部分反映双方在亲密关系中的期待与互动方式。`
      },
      {
        title: "交叉对照",
        content: contrastSignals.length ? contrastSignals.join("；") : "当前交叉对照信息不足。"
      },
      {
        title: "规则命中",
        content: compatibilityEngine.ruleHits.length
          ? compatibilityEngine.ruleHits.slice(0, 3).map((item) => `${item.title}：${item.evidence}`).join("；")
          : "当前没有命中明显的高权重规则，需要结合完整盘面继续判断。"
      },
      {
        title: "结果边界",
        content: `你方福德宫 ${ownerSpirit && ownerSpirit.starsText ? ownerSpirit.starsText : "待解析"}；对方福德宫 ${counterpartSpirit && counterpartSpirit.starsText ? counterpartSpirit.starsText : "待解析"}。长期相处时要同时照顾彼此的情绪承载方式。当前结果属于双方真实命盘的结构化对照，不等于传统门派中的完整人工合盘断语。`
      }
    ],
    rituals: MODE_META.relationship.good.length ? {
      good: MODE_META.relationship.good,
      bad: MODE_META.relationship.bad
    } : { good: [], bad: [] },
    chartMeta: {
      solarDate: owner.chartMeta.solarDate,
      lunarDate: owner.chartMeta.lunarDate,
      chineseDate: owner.chartMeta.chineseDate,
      time: owner.chartMeta.time,
      timeRange: owner.chartMeta.timeRange,
      sign: owner.chartMeta.sign,
      zodiac: owner.chartMeta.zodiac,
      soul: owner.chartMeta.soul,
      body: owner.chartMeta.body,
      fiveElementsClass: owner.chartMeta.fiveElementsClass,
      modeLabel: "关系合盘",
      counterpartName: counterpart.name,
      counterpartSoul: counterpart.chartMeta.soul,
      counterpartBody: counterpart.chartMeta.body,
      counterpartLifeElement: counterpart.chartMeta.fiveElementsClass,
      relationMethod: "当前结果=双方真实紫微命盘 + 夫妻宫/命宫/交友宫/福德宫结构对照。属于产品内的规则化合盘分析，不等同于传统门派的完整人工合盘断盘。",
      relationMethodType: "structured_compare",
      relationAccurateScope: "双方个人命盘数据真实；关系结论为基于真实盘面的结构对照，不可直接视作门派定盘结论。",
      relationBasis,
      compatibilityEngine
    },
    palaces: owner.palaces
  };
}

function normalizeRecord(record) {
  if (record.chartMeta && record.palaces && record.palaces.length === 12) {
    return record;
  }

  if (record.birthDate && record.gender && record.hourBranch) {
    try {
      const rebuilt = buildRecordFromChart(
        {
          name: record.name,
          birthDate: record.birthDate,
          calendarType: record.calendarType || "solar",
          gender: record.gender,
          hourBranch: record.hourBranch,
          mode: record.mode || "natal"
        },
        getRealChart({
          birthDate: record.birthDate,
          calendarType: record.calendarType || "solar",
          gender: record.gender,
          hourBranch: record.hourBranch
        })
      );

      return Object.assign({}, rebuilt, {
        id: record.id,
        name: record.name,
        createdAt: record.createdAt || rebuilt.createdAt
      });
    } catch (error) {
      return record;
    }
  }

  return record;
}

function buildRecordSummary(record) {
  const item = normalizeRecord(record);
  return {
    id: item.id,
    name: item.name,
    birthDate: item.birthDate,
    calendarType: item.calendarType,
    gender: item.gender,
    mode: item.mode || "natal",
    hourLabel: item.hourLabel,
    createdAt: item.createdAt,
    mainStar: item.mainStar,
    supportStar: item.supportStar,
    lifeElement: item.lifeElement,
    celestialStem: item.celestialStem,
    luckScore: item.luckScore,
    summary: item.summary,
    chartMeta: item.chartMeta || null
  };
}

function buildHomePayload(store) {
  const records = store.records.map(normalizeRecord);
  const owner = getOwnerRecord(store);
  const daily = buildDailyPayload(store);
  const updates = owner
    ? [
        {
          id: "u1",
          tag: "主档案",
          title: `${owner.name} 的主档案已固定`,
          content: "后续今日运势、年度运势、关系合盘都会优先读取这份档案。"
        },
        {
          id: "u2",
          tag: "今日建议",
          title: "先看今日，再看年度",
          content: "今天适合优先查看今日运势；如果要做阶段判断，再进入年度运势。"
        },
        {
          id: "u3",
          tag: "合盘说明",
          title: "关系合盘已接入规则引擎",
          content: "当前合盘结果基于真实双盘与规则命中，不再只是简单结构对照。"
        }
      ]
    : [
        {
          id: "u1",
          tag: "首次使用",
          title: "先创建你的主档案",
          content: "先固定一份本命盘，后面的今日运势、年度运势和关系合盘才会真正可用。"
        },
        {
          id: "u2",
          tag: "排盘说明",
          title: "单人命盘已使用真实排盘",
          content: "当前本命盘、年度运势都使用真实紫微斗数盘面，而不是随机 mock。"
        }
      ];
  return {
    ownerReady: Boolean(owner),
    hero: {
      title: daily.title,
      subtitle: daily.subtitle,
      description: daily.description,
      soul: owner && owner.chartMeta ? owner.chartMeta.soul : "紫微",
      body: owner && owner.chartMeta ? owner.chartMeta.body : "天府",
      element: owner ? owner.lifeElement : "木三局",
      quote: owner ? owner.quote : "填写出生信息后，即可生成基于真实紫微斗数排盘的命盘结果。"
    },
    gateways: [
      { key: "daily", path: "/pages/daily/index" },
      { key: "annual", path: "/pages/annual/index" },
      { key: "relationship", path: "/pages/relationship/index" },
      { key: "archive", path: "/pages/archive/index" }
    ],
    updates,
    rituals: daily.hasOwner
      ? { good: daily.good, bad: daily.bad }
      : {
          good: ["先生成命盘", "查看十二宫主星", "核对农历与时辰"],
          bad: ["直接把页面评分当作传统断语"]
        },
    recentRecords: records.slice(0, 3).map(buildRecordSummary)
  };
}

function buildArchivePayload(store) {
  const records = store.records.map(normalizeRecord);
  const latest = records[0];
  const owner = getOwnerRecord(store);
  return {
    profile: owner
      ? {
          id: owner.id,
          name: owner.name,
          mainStar: owner.chartMeta ? owner.chartMeta.soul : owner.mainStar,
          supportStar: owner.chartMeta ? owner.chartMeta.body : owner.supportStar,
          lifeElement: owner.lifeElement,
          celestialStem: owner.celestialStem,
          quote: owner.quote
        }
      : null,
    stats: {
      totalRecords: records.length,
      realCharts: records.filter((item) => item.chartMeta && item.palaces && item.palaces.length === 12).length,
      latestCreatedAt: latest ? latest.createdAt : "",
      ownerReady: Boolean(owner)
    },
    records: records.map(buildRecordSummary)
  };
}

function notFound(res) {
  sendJson(res, 404, { message: "Not found" });
}

const server = http.createServer(async (req, res) => {
  try {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: SERVICE_NAME,
      version: APP_VERSION,
      environment: NODE_ENV,
      storage: DATABASE_URL ? "postgres" : "json",
      now: new Date().toISOString()
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/home") {
    const store = await syncNormalizedStore();
    sendJson(res, 200, buildHomePayload(store));
    return;
  }

  if (req.method === "GET" && pathname === "/api/profile") {
    const store = await syncNormalizedStore();
    sendJson(res, 200, { owner: getOwnerRecord(store) });
    return;
  }

  if (req.method === "GET" && pathname === "/api/daily") {
    const store = await syncNormalizedStore();
    sendJson(res, 200, buildDailyPayload(store));
    return;
  }

  if (req.method === "GET" && pathname === "/api/records") {
    const store = await syncNormalizedStore();
    sendJson(res, 200, buildArchivePayload(store));
    return;
  }

  if (req.method === "POST" && pathname === "/api/charts") {
    try {
      let body = await parseBody(req);
      const store = await syncNormalizedStore();
      const owner = getOwnerRecord(store);
      const mode = body.mode || "natal";

      if (mode === "relationship") {
        if (!owner) {
          sendJson(res, 400, { message: "请先完成你的本命盘创建" });
          return;
        }
        if (!body.name || !body.birthDate || !body.gender || !body.hourBranch) {
          sendJson(res, 400, { message: "请完整填写对方信息" });
          return;
        }
        const counterpartChart = getRealChart(body);
        const record = buildRelationshipRecordFromCharts(owner, body, counterpartChart);
        store.records.unshift(record);
        await writeStore(store);
        sendJson(res, 201, { record });
        return;
      }

      if (mode === "annual") {
        if (!owner) {
          sendJson(res, 400, { message: "请先完成你的本命盘创建" });
          return;
        }
        body = Object.assign({}, body, {
          name: owner.name,
          birthDate: owner.birthDate,
          calendarType: owner.calendarType,
          gender: owner.gender,
          hourBranch: owner.hourBranch,
          mode: "annual"
        });
      }

      if (!body.name || !body.birthDate || !body.gender || !body.hourBranch) {
        sendJson(res, 400, { message: "Missing required fields" });
        return;
      }

      const chart = getRealChart(body);
      const record = buildRecordFromChart(body, chart);
      store.records.unshift(record);
      if (!store.ownerProfileId && (record.mode || "natal") === "natal") {
        store.ownerProfileId = record.id;
      }
      await writeStore(store);
      sendJson(res, 201, { record });
    } catch (error) {
      sendJson(res, 400, { message: error.message || "Chart generation failed" });
    }
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/api/charts/")) {
    const id = pathname.split("/").pop();
    const store = await syncNormalizedStore();
    const record = store.records.map(normalizeRecord).find((item) => item.id === id);
    if (!record) {
      notFound(res);
      return;
    }
    sendJson(res, 200, { record });
    return;
  }

  notFound(res);
  } catch (error) {
    console.error("Request failed:", error);
    if (!res.headersSent) {
      sendJson(res, 500, { message: "Internal server error" });
    } else {
      res.end();
    }
  }
});

async function bootstrap() {
  await ensureStore();
  server.listen(PORT, HOST, () => {
    const storageMode = DATABASE_URL ? "PostgreSQL" : "JSON";
    console.log(`Celestial API running at http://${HOST}:${PORT} (${storageMode} storage)`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start Celestial API:", error);
  process.exit(1);
});
