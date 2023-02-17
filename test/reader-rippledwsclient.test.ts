import Client from 'rippled-ws-client'

import {
  LiquidityCheck,
  RatesInCurrency,
  Errors
} from '../src'

let RippledWsClientConnection: Client

const trade = {
  from: {
    currency: 'XRP'
  },
  amount: 10000,
  to: {
    currency: 'USD',
    issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
  }
}
const options = {
  rates: RatesInCurrency.to
}

beforeAll(async () => {
  RippledWsClientConnection = await new Client('wss://xrplcluster.com')
  RippledWsClientConnection.on('error', (e: Error | string) => console.log(`XRPL Error`, e))
  return RippledWsClientConnection
})

afterAll(async () => {
  await RippledWsClientConnection.close()
  return new Promise(resolve => setTimeout(() => resolve(null), 100))
})

describe('XRPL Orderbook Reader', () => {
  it('should get rate for XRP to Gatehub USD', async () => {
    const Check = new LiquidityCheck({
      trade,
      options,
      method: RippledWsClientConnection.send
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
      method: RippledWsClientConnection.send
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
      method: RippledWsClientConnection.send
    })
    const Liquidity = await Check.get()

    return expect(Liquidity.errors).toEqual([
      Errors.REQUESTED_LIQUIDITY_NOT_AVAILABLE,
      Errors.REVERSE_LIQUIDITY_NOT_AVAILABLE
    ])
  })

  it('should throw timeout error', async () => {
    const Check = new LiquidityCheck({
      trade,
      options: {
        timeoutSeconds: 0.0001
      },
      method: RippledWsClientConnection.send
    })

    return expect(new Promise(resolve => {
      resolve(Check.get())
    })).rejects.toThrow('Timeout fetching order book data')
  })
})
