import { trace, Span } from '@opentelemetry/api';

import { AuthServiceResponse } from './definitions';
import { Config } from '../../config';

export const createResponse = <T = unknown>(
    data?: T,
    message: string = 'Action handled successfully',
    success: boolean = true
): AuthServiceResponse => ({ message, success, ...data });

export const makeSpan = <F extends () => ReturnType<F>>(name: string, fn: F): ReturnType<F> => {
    if (Config.isOtelEnabled()) {
        return trace.getTracer('auth').startActiveSpan(name, (span: Span) => {
            try {
                return fn();
            } finally {
                span.end();
            }
        });
    } else {
        return fn();
    }
};
