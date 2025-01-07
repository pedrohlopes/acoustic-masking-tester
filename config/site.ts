export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Auditory masking tester",
  description: "Make perceptive tests to understand the auditory masking effect on your hearing",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Tests",
      href: "/tests",
    },
    {
      label: "Statistics",
      href: "/stats",
    }
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Tests",
      href: "/tests",
    },
    {
      label: "Statistics",
      href: "/stats",
    }
  ],
  links: {
    github: "https://github.com/pedrohlopes/acoustic-masking-tester",
    twitter: "https://twitter.com/getnextui",
    docs: "https://nextui.org",
  },
};
