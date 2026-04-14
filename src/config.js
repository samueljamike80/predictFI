const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.eitherway.ai';

export const DIALECT_PROXY = `${API_BASE_URL}/api/dialect`;
export const DFLOW_PROXY = `${API_BASE_URL}/api/dflow`;
export const SOLANA_RPC_PROXY = `${API_BASE_URL}/api/solana/rpc`;
export const QN_RPC_PROXY = `${API_BASE_URL}/api/quicknode/rpc/solana`;
export const PROXY_API = (url) => `${API_BASE_URL}/api/proxy-api?url=${encodeURIComponent(url)}`;

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

export const KAMINO_MAIN_MARKET = '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';
export const USDC_RESERVE_MAIN = 'D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59';
export const SOL_RESERVE_MAIN = 'd4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q';

export const PREDICTION_MARKET_API = `${DFLOW_PROXY}/e.prediction-markets-api.dflow.net/api/v1`;
export const DFLOW_ORDER_API = `${DFLOW_PROXY}/e.quote-api.dflow.net`;

export const NETWORK = 'mainnet-beta';
