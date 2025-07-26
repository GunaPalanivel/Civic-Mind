export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface PaginationParams {
    page: number;
    limit: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    page: number;
    totalPages: number;
}
//# sourceMappingURL=api.d.ts.map