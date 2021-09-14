import { sign, SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
    userId?: number | string;
    sessionId?: string;
    email?: string;
}

export abstract class BaseJwt {
    public readonly userId: number | string;
    public readonly sessionId: string;
    public readonly email: string;

    protected readonly rawToken: string;

    public constructor(
        protected readonly payload: JwtPayload,
        protected readonly secret: string,
        protected readonly rawOptions: SignOptions
    ) {
        const options: SignOptions = { ...rawOptions, algorithm: rawOptions.algorithm ?? 'HS256' };
        this.rawToken = sign(payload, secret, options);
        this.userId = payload.userId as string;
        this.sessionId = payload.sessionId as string;
        this.email = payload.email as string;
    }

    public toString(): string {
        return `bearer ${this.rawToken}`;
    }
}
