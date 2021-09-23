import { Utils } from './utils';
import { HttpResponse } from '../src/api/interfaces/http-handler';

export namespace Validation {
    function isTokenPayload(arg: any): arg is Utils.TokenPayload {
        return !!arg['userId'] && !!arg['sessionId'];
    }

    export function validateSuccessfulRequest(
        response: HttpResponse,
        messageToValidate: string = 'Action handled successfully'
    ): void {
        expect(() => JSON.stringify(response)).not.toThrow();
        expect(response.success).toBe(true);
        expect(response.message).toBe(messageToValidate);
    }

    export function validateAnonymous(response: HttpResponse<Utils.SessionInformation>): void {
        validateSuccessfulRequest(response, 'anonymous');
        expect(response.headers['authentication']).toBeFalsy();
        expect(response.userId).toBe(0);
        expect(response.sessionId).toBe('0');
    }

    export function validateAccessToken(response: HttpResponse): void {
        validateSuccessfulRequest(response);
        const token = response.headers['authentication'] as string;
        expect(token).toBeTruthy();
        const tokenParts = token.split('.');
        expect(tokenParts.length).toBe(3);
        expect(isTokenPayload(Utils.decodeBase64(tokenParts[1]))).toBe(true);
    }

    export function validateAuthentication(
        response: HttpResponse<{ userId: number }>,
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
