const FALLBACK_LOCAL_API_CANDIDATES = [
  "http://127.0.0.1:4000",
  "http://localhost:4000"
];

const DEFAULT_REMOTE_API_BASE = "https://api.pppfdsfs.top";

function getAccountEnvVersion() {
  try {
    const info = wx.getAccountInfoSync && wx.getAccountInfoSync();
    return (info && info.miniProgram && info.miniProgram.envVersion) || "develop";
  } catch (error) {
    return "develop";
  }
}

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function resolveApiBaseCandidates() {
  const manualBase = normalizeBaseUrl(wx.getStorageSync("ziwei_api_base"));
  if (manualBase) {
    return [manualBase];
  }

  const envVersion = getAccountEnvVersion();
  if (envVersion === "develop") {
    return FALLBACK_LOCAL_API_CANDIDATES.slice();
  }

  const remoteBase = normalizeBaseUrl(DEFAULT_REMOTE_API_BASE);
  if (remoteBase) {
    return [remoteBase];
  }

  return FALLBACK_LOCAL_API_CANDIDATES.slice();
}

module.exports = {
  resolveApiBaseCandidates,
  getAccountEnvVersion,
  FALLBACK_LOCAL_API_CANDIDATES
};
