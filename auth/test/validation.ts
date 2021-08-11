import { Utils } from './utils';

export namespace Validation {
    function isTokenPayload(arg: any): arg is Utils.TokenPayload {
        return !!arg['userId'] && !!arg['sessionId'];
    }

    export function validateSuccessfulRequest(
        response: Utils.ServerResponse,
        messageToValidate: string = 'Action handled successfully'
    ): void {
        expect(() => JSON.stringify(response)).not.toThrow();
        expect(response.success).toBe(true);
        expect(response.message).toBe(messageToValidate);
    }

    export function validateAccessToken(response: Utils.ServerResponse): void {
        validateSuccessfulRequest(response);
        const token = response.headers['authentication'];
        expect(token).toBeTruthy();
        const tokenParts = token.split('.');
        expect(tokenParts.length).toBe(3);
        expect(isTokenPayload(Utils.decodeBase64(tokenParts[1]))).toBe(true);
    }

    export function validateAuthentication(
        response: Utils.ServerResponse,
        userIdToValidate: number,
        messageToValidate?: string
    ): void {
        validateSuccessfulRequest(response, messageToValidate);
        expect(response.userId).toBe(userIdToValidate);
    }

    export function validateForbiddenRequest(errorResponse: any): void {
        expect(errorResponse.status).toBe(403);
    }
}
