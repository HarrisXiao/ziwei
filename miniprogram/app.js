const { resolveApiBaseCandidates, FALLBACK_LOCAL_API_CANDIDATES } = require("./config");

App({
  globalData: {
    apiBaseUrl: FALLBACK_LOCAL_API_CANDIDATES[0],
    apiBaseCandidates: resolveApiBaseCandidates(),
    currentRecord: null
  }
});
