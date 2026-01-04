module.exports = {
  apps: [
    {
      name: "pokedex-server",
      script: "src/server.js",
      cwd: "/home/ubuntu/pokedex-server",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
