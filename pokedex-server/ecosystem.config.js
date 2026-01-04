module.exports = {
  apps: [
    {
      name: "pokedex-server",
      script: "npm",
      args: "run dev",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
