# XRPL Orderbook Reader

This repository takes XRPL Orderbook (`book_offers`) datasets and requested volume to
exchange and calculates the effective exchange rates based on the requested and available liquidity.

Optionally certain checks can be specified (eg. `book_offers` on the other side of the book)
to warn for limited (percentage) liquidity on the requested side, and possibly other side
of the order book.

**Typescript 3.8+ is required**

## How to use:
For now: See `samples/Sample.ts`

Please note that the Params require a `send` method to be present. The `send` method passed
to the Params should take an object with a `command` for rippled and return a `Promise`
that will resolve to contain requested order book lines. This has been tested with
[rippled-ws-client](https://www.npmjs.com/package/rippled-ws-client)
