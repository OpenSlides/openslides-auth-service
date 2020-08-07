export interface Token {
    expiresAt: Date;
    userId: string;
    sessionId: string;
    iat: number;
    exp: number;
}
