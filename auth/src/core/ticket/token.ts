export interface Token {
    payload: {
        expiresAt: Date;
        userId: number;
        sessionId: string;
    };
    signature: string;
}
