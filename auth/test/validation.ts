import { Utils } from './utils';

export namespace Validation {
    function isTokenPayload(arg: any): arg is Utils.TokenPayload {
        return !!arg['userId'] && !!arg['sessionId'];
    }

    export function validateSuccessfulRequest(response: Utils.ServerResponse): void {
        expect(response.success).toBe(true);
    }

    export function validateAccessToken(response: Utils.ServerResponse): void {
        const token = response.headers['authentication'];
        expect(token).toBeTruthy();
        const tokenParts = token.split('.');
        expect(tokenParts.length).toBe(3);
        expect(isTokenPayload(Utils.decodeBase64(tokenParts[1]))).toBe(true);
    }

    export function validateAuthentication(response: Utils.ServerResponse, userIdToValidate: number): void {
        expect(response.success).toBe(true);
        expect(response.userId).toBe(userIdToValidate);
    }

    export function validateForbiddenRequest(errorResponse: any): void {
        expect(errorResponse.status).toBe(403);
    }
}
