{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/claude.js": {
      "runtime": "nodejs20.x"
    }
  },
  "rewrites": [
    { "source": "/api/claude", "destination": "/api/claude" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
