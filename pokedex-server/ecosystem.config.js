module.exports = {
  apps: [
    {
      name: "pokedex-server",
      cwd: "/home/ubuntu/pokedex-monorepo/pokedex-server",
      script: "src/server.js",
      env_file: "/home/ubuntu/.env.pokedex.prod",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
