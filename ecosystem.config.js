module.exports = {
  apps: [
    {
      name: "next-app",
      script: "bun",
      args: "run start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

