import { serve } from "bun";
import index from "./index.html";
import { snapshotAtDays, daysSinceEpochFromDate } from "./solar/model";
import { MS_PER_DAY } from "./solar/constants";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    "/api/solar/state": async req => {
      // Accept either `?tDays=...` or `?at=ISO_DATE` or `?ms=...`
      const url = new URL(req.url);
      const tDaysStr = url.searchParams.get("tDays");
      const atISO = url.searchParams.get("at");
      const msStr = url.searchParams.get("ms");

      let tDays: number;
      if (tDaysStr) {
        tDays = Number(tDaysStr);
      } else if (msStr) {
        tDays = Number(msStr) / MS_PER_DAY;
      } else if (atISO) {
        tDays = daysSinceEpochFromDate(new Date(atISO));
      } else {
        tDays = daysSinceEpochFromDate(new Date());
      }

      return Response.json(snapshotAtDays(tDays));
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
