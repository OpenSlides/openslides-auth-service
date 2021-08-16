import { sign, SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
    userId: number | string;
    sessionId: string;
}

export abstract class BaseJwt {
    public readonly userId: number | string;
    public readonly sessionId: string;

    protected readonly rawToken: string;

    public constructor(
        protected readonly payload: JwtPayload,
        protected readonly secret: string,
        protected readonly rawOptions: SignOptions
    ) {
        const options: SignOptions = { ...rawOptions, algorithm: rawOptions.algorithm ?? 'HS256' };
        this.rawToken = sign(payload, secret, options);
        this.userId = payload.userId;
        this.sessionId = payload.sessionId;
    }

    public toString(): string {
        return `bearer ${this.rawToken}`;
    }
}
