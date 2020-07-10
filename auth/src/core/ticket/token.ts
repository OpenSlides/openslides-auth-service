export interface Token {
    expiresAt: Date;
    username: string;
    userId: string;
    sessionId: string;
    iat: number;
    exp: number;
}
