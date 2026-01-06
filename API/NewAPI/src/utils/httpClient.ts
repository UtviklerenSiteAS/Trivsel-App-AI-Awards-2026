import { fetch, Response } from 'undici';
import { logger } from './logger';
import { env } from '../config';

interface FetchOptions {
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
}

const DEFAULT_TIMEOUT = 8000; // 8 seconds
const MAX_RETRIES = 1;

export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
    const { retries = MAX_RETRIES, timeout = DEFAULT_TIMEOUT, headers = {} } = options;

    const finalHeaders = {
        'User-Agent': env.MET_USER_AGENT,
        ...headers
    };

    let attempt = 0;

    while (attempt <= retries) {
        try {
            if (attempt > 0) {
                const backoff = 500 * Math.pow(2, attempt - 1);
                logger.warn(`Retrying ${url} (attempt ${attempt}/${retries}) after ${backoff}ms`);
                await new Promise(resolve => setTimeout(resolve, backoff));
            }

            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                headers: finalHeaders,
                signal: controller.signal
            });

            clearTimeout(id);

            // Don't retry on 4xx errors
            if (response.ok || (response.status >= 400 && response.status < 500)) {
                return response;
            }

            throw new Error(`Request failed with status ${response.status}`);

        } catch (err: any) {
            const isLastAttempt = attempt === retries;
            const isAbort = err.name === 'AbortError';

            logger.error({
                msg: 'Fetch error',
                url,
                attempt: attempt + 1,
                error: err.message,
                isAbort
            });

            if (isLastAttempt) {
                throw err;
            }
        }
        attempt++;
    }

    throw new Error('Unreachable code');
}
