import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Action, Resource } from "./permission-types";
import { UserRole } from "../enums/user-roles.enum";
import { permissions } from "../config/permissions";

export class AuthMiddleware {
  static async decodeToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        resolve(decoded);
      } catch (error) {
        reject(error);
      }
    });
  }

  static async verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }

      const decoded = await AuthMiddleware.decodeToken(token);
      req.body.ownerId = decoded.id; // Assuming the token contains an 'id' field
      req.body.user = decoded;
      req.body.userRole = decoded.roles;
      res.locals.ownerId = decoded.id;
      res.locals.user = decoded;
      next();
    } catch (error) {
      req.log?.error({ err: error }, "verifyToken failed");
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
  }

  static authorize(resource: Resource, action: Action) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = req.body.user;
        delete req.body.user;
        const roleId = (user.roles ??
          UserRole.GUEST) as keyof typeof permissions;
        const rolePermissions = permissions[roleId];
        if (rolePermissions && rolePermissions[resource]?.includes(action)) {
          next();
          return;
        }
        res.status(403).json({ message: "Forbidden" });
      } catch (error) {
        req.log?.error({ err: error }, "authorize middleware failed");
        res.status(500).json({ message: "Server error" });
      }
    };
  }
}
