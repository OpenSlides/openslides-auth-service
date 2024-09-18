import { Span, trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import { addShutdownHook } from './helper';
import { Logger } from '../api/services/logger';
import { Config } from '../config';

export const initOtel = (): void => {
    if (!Config.isOtelEnabled()) {
        return;
    }
    const provider = new NodeTracerProvider({
        resource: new Resource({
            [SEMRESATTRS_SERVICE_NAME]: 'auth'
        })
    });
    const exporter = new OTLPTraceExporter({
        url: 'http://collector:4317'
    });
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    provider.register();
    trace.setGlobalTracerProvider(provider);
    registerInstrumentations({
        instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()]
    });
    addShutdownHook(() => {
        provider.shutdown().catch(err => Logger.error(err));
    });
    Logger.log('OpenTelemetry initialized');
};

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
