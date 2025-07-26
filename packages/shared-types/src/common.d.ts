export interface User {
    id: string;
    email: string;
    name: string;
    role: 'citizen' | 'representative' | 'admin';
}
export interface CivicIssue {
    id: string;
    title: string;
    description: string;
    category: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    createdBy: string;
    createdAt: Date;
}
//# sourceMappingURL=common.d.ts.map