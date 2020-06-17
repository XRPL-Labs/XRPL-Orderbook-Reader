import Client from 'rippled-ws-client'
import {
  LiquidityCheck,
  RatesInCurrency,
  Errors
} from '../src'

let Connection: Client

const trade = {
  from: {
    currency: 'XRP'
  },
  amount: 1000000,
  to: {
    currency: 'USD',
    issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
  }
}
const options = {
  rates: RatesInCurrency.to
}

beforeAll(async () => {
  Connection = await new Client('wss://xrpl.ws')
  Connection.on('error', (e: Error | string) => console.log(`XRPL Error`, e))
  return Connection
})

afterAll(async () => {
  return Connection.close()
})

describe('XRPL Orderbook Reader', () => {
  it('should get rate for XRP to Gatehub USD', async () => {
    const Check = new LiquidityCheck({
      trade,
      options,
      method: Connection.send
    })
    const Liquidity = await Check.get()

    return expect(Liquidity.rate).toBeGreaterThan(0)
  })

  it('should exceed absurd limits for XRP to Gatehub USD', async () => {
    const Check = new LiquidityCheck({
      trade,
      options: {
        ...options,
        maxSpreadPercentage: 0.0001,
        maxSlippagePercentage: 0.0001,
        maxSlippagePercentageReverse: 0.0001
      },
      method: Connection.send
    })
    const Liquidity = await Check.get()

    return expect(Liquidity.errors).toEqual([
      Errors.MAX_SPREAD_EXCEEDED,
      Errors.MAX_SLIPPAGE_EXCEEDED,
      Errors.MAX_REVERSE_SLIPPAGE_EXCEEDED
    ])
  })

  it('should error out with insufficient liquidity', async () => {
    const Check = new LiquidityCheck({
      trade,
      options: {
        ...options,
        maxBookLines: 1
      },
      method: Connection.send
    })
    const Liquidity = await Check.get()

    return expect(Liquidity.errors).toEqual([
      Errors.REQUESTED_LIQUIDITY_NOT_AVAILABLE,
      Errors.REVERSE_LIQUIDITY_NOT_AVAILABLE
    ])
  })

  it('should error out at insufficient offers', async () => {
    const Check = new LiquidityCheck({
      trade,
      options: {
        ...options,
        minOfferCount: 999
      },
      method: Connection.send
    })
    const Liquidity = await Check.get()

    return expect(Liquidity.errors).toContain(Errors.INSUFFICIENT_AMOUNT_OF_OFFERS)
  })
})
