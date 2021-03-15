import { NextFunction, Request, Response } from "express";

export function HerokuHTTPS(req: Request, res: Response, next: NextFunction) {

    if (Boolean(process.env.USE_HTTPS) && req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(302, "https://" + req.hostname + req.originalUrl);
    }
    return next();
  }
  