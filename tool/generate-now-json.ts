const nowProd = require("../now-prod.json");
const { env: envProd } = nowProd;

const env: { [key: string]: string } = {};
Object.keys(envProd).forEach((k) => {
  const v: string = envProd[k];
  if (v.startsWith("@")) {
    // `now dev` doesn't support secret
    const p = process.env[k];
    if (typeof p === "string") {
      env[k] = p;
    }
  } else {
    env[k] = v;
  }
});

const now = { ...nowProd, env };
process.stdout.write(JSON.stringify(now, null, 2));
