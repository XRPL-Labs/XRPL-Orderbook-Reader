import Debug from 'debug'
const { XrplClient } = require('xrpl-client')
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
  const Connection = new XrplClient()
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
    },
    options: {
      rates: RatesInCurrency.to,
      timeoutSeconds: 10,
      maxSpreadPercentage: 4,
      maxSlippagePercentage: 3,
      maxSlippagePercentageReverse: 3,
      // maxBookLines: 500,
      // includeBookData: true,
      // verboseBookData: true,
    },
    client: Connection
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
