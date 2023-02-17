# XRPL Orderbook Reader [![npm version](https://badge.fury.io/js/xrpl-orderbook-reader.svg)](https://www.npmjs.com/xrpl-orderbook-reader)

This repository takes XRPL Orderbook (`book_offers`) datasets and requested volume to
exchange and calculates the effective exchange rates based on the requested and available liquidity.

Optionally certain checks can be specified (eg. `book_offers` on the other side of the book)
to warn for limited (percentage) liquidity on the requested side, and possibly other side
of the order book.

**Typescript 3.8+ is required**

## How to use:
For now: See `samples/Sample.ts`

### Call & get results

Please create one `LiquidityCheck` instance per pair (from/to).

```
  const Lc = new LiquidityCheck(Params)
  const Lq = await Lc.get()
  log(Lq.rate)
```

You can update Params and fetch new data, and get the results based on the new data
with the `refresh` method. When called without input parameter (`refresh()`) existing
Params will be used based on fresh order book information. If a new Params object is
provided, the entire instance will be updated.

```
  // Lc instance already exists
  // const Lc = new LiquidityCheck(Params)
  
  Params.trade.amount += 1000

  Lc.refresh(Params)
  const newLq = await Lc.get()
```

Available options [here](https://github.com/XRPL-Labs/XRPL-Orderbook-Reader/blob/38be170007366095bd078713ecbb65684420539d/src/types/Reader.ts#L17).

### Client
This lib. requires a connection to an XRPL node. There are two supported clients:

#### Preferred: `xrpl-client` - https://www.npmjs.com/package/xrpl-client

You can pass the entire class instance of `xrpl-client` to the Params object. You
pass the class as `client` property.

```
new LiquidityCheck({
  <...>,
  client: new XrplClient()
})
```

#### Deprecated: `rippled-ws-client` - https://www.npmjs.com/package/rippled-ws-client

You can pass the `send` method of `rippled-ws-client` to the Params object as `method` property.

```
new LiquidityCheck({
  <...>,
  method: RippledWsClientInstance.send
})
```

#### Custom WebSocket/... implementation

You can pass a `send` method to the Params object. The `send` method passed
to the Params should take an object with a `command` for rippled and return a `Promise`
that will resolve to contain requested order book lines. You pass a function as `method` property.

```
new LiquidityCheck({
  <...>,
  method: (JsonRequestWithCommand) => {
    return new Promise(resolve) {
      // Custom implementation to fetch the book results
    }
  }
})
```


## Sample in JS (not TS) environment(s):

Please see `/samples/PlainSample.js`

## How to...

##### Test:

`npm run test`

##### Run development code:

`npm run dev` (Compiles and runs `/samples/Sample.ts`)
