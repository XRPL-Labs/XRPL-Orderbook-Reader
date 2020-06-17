import Debug from 'debug'
import Client from 'rippled-ws-client'
import {
  LiquidityCheck,
  Params as LiquidityCheckParams,
  RatesInCurrency
} from '../src/'

const log = Debug('orderbook:sample')

const main = async () => {
  /**
   * XRPL Connection
   */
  const Connection = await new Client('wss://xrpl.ws')

  // Connection.on('ledger', (l: any) => log(`XRPL Ledger`, l))
  // Connection.on('state', (s: any) => log(`XRPL State`, s))
  Connection.on('error', (e: Error | string) => log(`XRPL Error`, e))

  /**
   * Liquidity Check
   */
  const Params: LiquidityCheckParams = {
    trade: {
      from: {
        currency: 'XRP'
      },
      amount: 500,
      to: {
        currency: 'EUR',
        issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
      }
      // to: {
      //   currency: 'USD',
      //   issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      // }
      // to: {
      //   currency: '534F4C4F00000000000000000000000000000000',
      //   issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz'A
      // }
    },
    options: {
      timeoutSeconds: 3,
      minOfferCount: 3,
      includeBookData: false,
      verboseBookData: false,
      rates: RatesInCurrency.to,
      maxSpreadPercentage: 2,
      maxSlippagePercentage: 3,
      maxSlippagePercentageReverse: 4,
      maxBookLines: 500
    },
    method: Connection.send
  }

  log(Params.trade)
  const Check = new LiquidityCheck(Params)
  const Liquidity = await Check.get()

  log(Liquidity)

  // log('rate', Liquidity.rate)
  // log('safe', Liquidity.safe)
  // log('errors', Liquidity.errors)

  /**
   * Please note: uses console.table instead of
   * Debug (log), as Debug is missing table output
   */
  if (typeof Liquidity.books !== 'undefined') {
    console.table(Liquidity.books[0])
    console.table(Liquidity.books[1])
  }

  /**
   * Sample: get new data every 4 seconds for higher
   * requested amount to exchange.
   */
  // setInterval(async () => {
  //   Params.trade.amount += 1000
  //   log(`Getting new Liquidity Data for (trade amount)`, Params.trade.amount)
  //   Check.refresh(Params)
  //   log(await Check.get())
  // }, 4000)

  Connection.close()
}

main()
