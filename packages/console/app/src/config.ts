/**
 * Application-wide constants and configuration
 */
export const config = {
  // Base URL
  baseUrl: "https://zingpop.ai",

  // GitHub
  github: {
    repoUrl: "https://zingpop.ai",
    starsFormatted: {
      compact: "140K",
      full: "140,000",
    },
  },

  // Social links
  social: {
    twitter: "https://zingpop.ai",
    discord: "https://zingpop.ai/support",
  },

  // Static stats (used on landing page)
  stats: {
    contributors: "850",
    commits: "11,000",
    monthlyUsers: "6.5M",
  },
} as const
