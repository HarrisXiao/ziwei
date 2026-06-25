const app = getApp();
const { resolveApiBaseCandidates } = require("../config");

function tryRequest(baseUrl, { url, method = "GET", data }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${url}`,
      method,
      data,
      timeout: 6000,
      header: {
        "content-type": "application/json"
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            data: res.data,
            baseUrl
          });
          return;
        }
        reject(new Error(res.data && res.data.message ? res.data.message : `HTTP ${res.statusCode}`));
      },
      fail: (error) => {
        reject(new Error(error.errMsg || "Network request failed"));
      }
    });
  });
}

async function request(options) {
  const candidates = app.globalData.apiBaseCandidates && app.globalData.apiBaseCandidates.length
    ? app.globalData.apiBaseCandidates
    : resolveApiBaseCandidates();
  let lastError = null;

  for (let i = 0; i < candidates.length; i += 1) {
    const baseUrl = candidates[i];
    try {
      const result = await tryRequest(baseUrl, options);
      app.globalData.apiBaseUrl = result.baseUrl;
      return result.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("API request failed");
}

module.exports = {
  getHome() {
    return request({ url: "/api/home" });
  },
  getProfile() {
    return request({ url: "/api/profile" });
  },
  getDaily() {
    return request({ url: "/api/daily" });
  },
  getRecords() {
    return request({ url: "/api/records" });
  },
  createChart(data) {
    return request({ url: "/api/charts", method: "POST", data });
  },
  getChart(id) {
    return request({ url: `/api/charts/${id}` });
  }
};
