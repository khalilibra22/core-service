import { Response } from "express";

export interface PaginatedResult<T> {
    data: T[];
    total: number;
}

export const setPaginationHeaders = (
    res: Response,
    total: number,
    page: number,
    limit: number
): void => {
    res.setHeader("X-Total-Count", total.toString());
    res.setHeader("X-Page", page.toString());
    res.setHeader("X-Limit", limit.toString());
}
