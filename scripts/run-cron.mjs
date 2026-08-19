const appUrl = process.env.APP_URL;
const cronSecret = process.env.CRON_SECRET;

if (!appUrl || !cronSecret) {
  console.error("APP_URL and CRON_SECRET must be set");
  process.exit(1);
}

const res = await fetch(new URL("/api/cron/run", appUrl), {
  method: "POST",
  headers: { "x-cron-secret": cronSecret },
});

const body = await res.text();
console.log(res.status, body);

if (!res.ok) process.exit(1);
