import type { NextFunction, Request, Response } from "express";
import type { Mode, UserRole } from "@raelix/shared";

const roleList: UserRole[] = ["admin", "family", "child", "guest"];
const modeList: Mode[] = ["family", "kids", "business", "developer"];

const sanitizeRole = (role: string | undefined, fallback: UserRole): UserRole => {
  if (!role) {
    return fallback;
  }
  return roleList.includes(role as UserRole) ? (role as UserRole) : fallback;
};

const sanitizeMode = (mode: string | undefined): Mode => {
  if (!mode) {
    return "family";
  }
  return modeList.includes(mode as Mode) ? (mode as Mode) : "family";
};

export interface RequestContext {
  userName: string;
  role: UserRole;
  mode: Mode;
}

declare global {
  namespace Express {
    interface Request {
      raelixContext?: RequestContext;
    }
  }
}

export const attachRequestContext = (defaultRole: UserRole) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const headerRole = req.header("x-raelix-role") ?? undefined;
    const headerMode = req.header("x-raelix-mode") ?? undefined;
    const userName = req.header("x-raelix-user") ?? "Owner";

    req.raelixContext = {
      userName,
      role: sanitizeRole(headerRole, defaultRole),
      mode: sanitizeMode(headerMode),
    };

    next();
  };
};
