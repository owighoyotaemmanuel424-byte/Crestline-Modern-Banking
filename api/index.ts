import type { Request, Response } from "express";

let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = import("../server.ts").then((module) => module.app);
  }
  return appPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error: any) {
    console.error("Crestline API initialization failure:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "API initialization failed"
    });
  }
}
