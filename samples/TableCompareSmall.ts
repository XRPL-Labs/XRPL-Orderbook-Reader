const { XrplClient } = require('xrpl-client')

import {
  LiquidityCheck,
  Params as LiquidityCheckParams,
  RatesInCurrency
} from '../src/'

const options = {
  timeoutSeconds: 10,
  rates: RatesInCurrency.to,
  maxSpreadPercentage: 4,
  maxSlippagePercentage: 3,
  maxSlippagePercentageReverse: 3
}

const main = async () => {
  const Connection = new XrplClient()
  Connection.on('error', (e: Error | string) => console.log(`XRPL Error`, e))

  const pairs = [
    {issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De', currency: '524C555344000000000000000000000000000000', displayName: 'RLUSD'},
  ]

  const data = await Promise.all(
    pairs.map(
      async p => {
        return await Promise.all([0.01, 0.1, 1, 10, 100, 1000, 10000, 100000, 1000000].map(async a => {
          const Params: LiquidityCheckParams = {
            trade: {
              from: {currency: 'XRP'},
              amount: a,
              to: {currency: p.currency, issuer: p.issuer}
            },
            options,
            client: Connection
          }

          const Check = new LiquidityCheck(Params)
          const r = await Check.get()

          return {
            name: p.displayName,
            amount: a,
            rate: r.rate,
            errors: r.errors
          }
        }
      )
    )
  }))

  // console.table(data.reduce((a, b) => {
  //   b.forEach(r => a.push(r))
  //   return a
  // }, []))
  data.forEach(d => console.table(d))

  Connection.close()
}


main()
