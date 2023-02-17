/**
 * Install:
 *   npm install xrpl-orderbook-reader rippled-ws-client debug
 * Run:
 *   DEBUG=* node index.js
 */

const Debug = require('debug')
const { XrplClient } = require('xrpl-client')
// const {LiquidityCheck} = require('xrpl-orderbook-reader') // Elsewhere
const {LiquidityCheck} = require('../') // Here (in this folder)
const log = Debug('orderbook')

const main = async () => {
  const Connection = new XrplClient()
  Connection.on('error', e => log(`XRPL Error`, e))

  const Check = new LiquidityCheck({
    trade: {
      from: {
        currency: 'XRP'
      },
      amount: 4500,
      to: {
        currency: 'USD',
        issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
      }
    },
    options: {
      // includeBookData: true,
      // verboseBookData: false,
      rates: 'to',
      maxSpreadPercentage: 3,
      maxSlippagePercentage: 4,
      maxSlippagePercentageReverse: 5
    },
    client: Connection
  })
  const Liquidity = await Check.get()

  log({Liquidity})
  // if (typeof Liquidity.books !== 'undefined') {
  //   console.table(Liquidity.books[0])
  //   console.table(Liquidity.books[1])
  // }

  Connection.close()
}

main()
