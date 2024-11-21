export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Masking tester",
  description: "Make perceptive tests to understand the acoustic masking effect on your hearing",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Tests",
      href: "/tests",
    },
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
  ],
  links: {
    github: "https://github.com/pedrohlopes/acoustic-masking-tester",
    twitter: "https://twitter.com/getnextui",
    docs: "https://nextui.org",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
