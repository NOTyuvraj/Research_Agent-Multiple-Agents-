import axios from "axios";

export async function webSearch(query) {
  try {
    const res = await axios.get("https://serpapi.com/search", {
      params: {
        q: query,
        api_key: process.env.SERP_API_KEY,
        engine: "google",
        num: 5,
      },
    });
    return JSON.stringify(res.data.organic_results.map((r) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
    })));
  } catch (err) {
    console.error("SerpApi error:", err.response?.data);
    throw err;
  }
}