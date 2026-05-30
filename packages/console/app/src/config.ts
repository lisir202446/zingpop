/**
 * Application-wide constants and configuration
 */
export const config = {
  // Base URL
  baseUrl: "https://www.zingpop.cn",

  // GitHub
  github: {
    repoUrl: "https://www.zingpop.cn",
    starsFormatted: {
      compact: "140K",
      full: "140,000",
    },
  },

  // Social links
  social: {
    twitter: "https://www.zingpop.cn",
    discord: "https://www.zingpop.cn",
  },

  // Static stats (used on landing page)
  stats: {
    contributors: "850",
    commits: "11,000",
    monthlyUsers: "6.5M",
  },
} as const
