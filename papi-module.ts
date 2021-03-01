import fetch from 'node-fetch';

export const papi_performance = typeof window !== 'undefined' ? window.performance : null;
export const papi_fetch = typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;
