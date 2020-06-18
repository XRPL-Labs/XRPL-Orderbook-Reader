import Client from 'rippled-ws-client'
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
  const Connection = await new Client('wss://xrpl.ws')
  Connection.on('error', (e: Error | string) => console.log(`XRPL Error`, e))

  const pairs = [
    {issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', currency: 'EUR', displayName: 'Gatehub EUR'},
    {issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', currency: 'USD', displayName: 'Gatehub USD'},
    {issuer: 'rchGBxcD1A1C2tdxF6papQYZ8kjRKMYcL', currency: 'BTC', displayName: 'Gatehub BTC'},
    {issuer: 'rcA8X3TVMST1n3CJeAdGk1RdRCHii7N2h', currency: 'ETH', displayName: 'Gatehub ETH'},
    {issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', currency: 'USD', displayName: 'Bitstamp USD'},
    {issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', currency: 'BTC', displayName: 'Bitstamp BTC'},
    {
      issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
      currency: '534F4C4F00000000000000000000000000000000',
      displayName: 'SOLO'
    }
  ]

  const data = await Promise.all(
    pairs.map(
      async p => {
        return await Promise.all([100, 1000, 2500, 5000, 10000, 20000].map(async a => {
          const Params: LiquidityCheckParams = {
            trade: {
              from: {currency: 'XRP'},
              amount: a,
              to: {currency: p.currency, issuer: p.issuer}
            },
            options,
            method: Connection.send
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
