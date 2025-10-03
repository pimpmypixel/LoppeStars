import { getHealth, getMarketsToday } from '../../utils/baseApi';

describe('API e2e tests', () => {
  it('returns health OK', async () => {
    const res = await getHealth();
    expect(res.status).toBeDefined();
  });

  it('fetches today markets array', async () => {
    const markets = await getMarketsToday();
    expect(Array.isArray(markets)).toBe(true);
  });
});