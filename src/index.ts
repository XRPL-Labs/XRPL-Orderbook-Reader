import Debug from 'debug'
import {
  Params as LiquidityCheckParams,
  Result as LiquidityCheckResult,
  RatesInCurrency,
  Options,
  Errors
} from './types/Reader'
import {Offer} from './types/XrplObjects'
import {
  LiquidityParser,
  ParseResult,
  ParseResultVerbose
} from './parser/LiquidityParser'
import BigNumber from 'bignumber.js'

interface BookOffersResponse {
  [key: string]: any
  offers: Offer[]
}

const log = Debug('orderbook')
const logRates = log.extend('rates')

class LiquidityCheck {
  private Params: LiquidityCheckParams
  private Book: Promise<Offer[]>
  private BookReverse: Promise<Offer[]>

  constructor (Params: LiquidityCheckParams) {
    // log('called')
    this.Params = Params
    this.Book = this.fetchBooks(true)
    this.BookReverse = this.fetchBooks(false)

    return this
  }

  async fetchBooks (requestedDirection: boolean = true): Promise<Offer[]> {
    log(`Get book_offers for ${requestedDirection ? 'requested' : 'reversed'} direction`)
    const book = await this.Params.method<BookOffersResponse>({
      command: 'book_offers',
      taker_gets: requestedDirection
        ? this.Params.trade.to
        : this.Params.trade.from,
      taker_pays: requestedDirection
        ? this.Params.trade.from
        : this.Params.trade.to,
      limit: this.Params.options?.maxBookLines || 500
    })

    log(`  > Got ${book.offers.length} book_offers for ${requestedDirection ? 'requested' : 'reversed'} direction`)

    return book.offers
  }

  detectErrors (books: Array<ParseResult[] | ParseResultVerbose[]>): Array<Errors> {
    const errors: Array<Errors> = []

    const tradeAmount = new BigNumber(this.Params.trade.amount)
    const book0Amount = new BigNumber(books[0].filter(l => l._Capped !== undefined).slice(-1)[0]._I_Spend_Capped)
    const book1Amount = new BigNumber(books[1].filter(l => l._Capped !== undefined).slice(-1)[0]._I_Get_Capped)

    const firstBookLine = books[0][0]
    const finalBookLine = books[0].filter(l => l._Capped !== undefined).slice(-1)[0]
    const startRate = new BigNumber(
      firstBookLine?._CumulativeRate_Cap || firstBookLine?._CumulativeRate
    )
    const finalRate = new BigNumber(
      finalBookLine?._CumulativeRate_Cap || finalBookLine?._CumulativeRate
    )

    const firstBookLineReverse = books[1][0]
    const finalBookLineReverse = books[1].filter(l => l._Capped !== undefined).slice(-1)[0]
    const startRateReverse = new BigNumber(
      firstBookLineReverse?._CumulativeRate_Cap || firstBookLineReverse?._CumulativeRate
    )
    const finalRateReverse = new BigNumber(
      finalBookLineReverse?._CumulativeRate_Cap || finalBookLineReverse?._CumulativeRate
    )

    /**
     * Now check for errors
     */

    if (!book0Amount.eq(tradeAmount)) {
      errors.push(Errors.REQUESTED_LIQUIDITY_NOT_AVAILABLE)
    }

    if (!book1Amount.eq(tradeAmount)) {
      errors.push(Errors.REVERSE_LIQUIDITY_NOT_AVAILABLE)
    }

    if (this.Params.options?.minOfferCount && books[0].length < this.Params.options?.minOfferCount) {
      errors.push(Errors.INSUFFICIENT_AMOUNT_OF_OFFERS)
    }

    if (this.Params.options?.maxSpreadPercentage) {
      const spread = new BigNumber(1).minus(startRate.dividedBy(startRateReverse)).abs().times(100)
      logRates({
        liquidityCheck: `MAX_SPREAD`,
        start: startRate.toNumber(),
        startReverse: startRateReverse.toNumber(),
        spread: spread.toNumber(),
        max: this.Params.options.maxSpreadPercentage
      })

      if (spread.gt(new BigNumber(this.Params.options.maxSpreadPercentage))) {
        errors.push(Errors.MAX_SPREAD_EXCEEDED)
      }
    }

    if (this.Params.options?.maxSlippagePercentage) {
      const slippage = new BigNumber(1).minus(startRate.dividedBy(finalRate)).abs().times(100)
      logRates({
        liquidityCheck: `MAX_SLIPPAGE`,
        start: startRate.toNumber(),
        final: finalRate.toNumber(),
        slippage: slippage.toNumber(),
        max: this.Params.options.maxSlippagePercentage
      })

      if (slippage.gt(new BigNumber(this.Params.options.maxSlippagePercentage))) {
        errors.push(Errors.MAX_SLIPPAGE_EXCEEDED)
      }
    }

    if (this.Params.options?.maxSlippagePercentageReverse) {
      const slippage = new BigNumber(1).minus(startRateReverse.dividedBy(finalRateReverse)).abs().times(100)
      logRates({
        liquidityCheck: `MAX_REVERSE_SLIPPAGE`,
        start: startRateReverse.toNumber(),
        final: finalRateReverse.toNumber(),
        slippage: slippage.toNumber(),
        max: this.Params.options.maxSlippagePercentageReverse
      })

      if (slippage.gt(new BigNumber(this.Params.options.maxSlippagePercentageReverse))) {
        errors.push(Errors.MAX_REVERSE_SLIPPAGE_EXCEEDED)
      }
    }

    return errors
  }

  async get (): Promise<LiquidityCheckResult> {
    let timeout
    const bookData = await Promise.race([
      new Promise(resolve => {
        const ms = this.Params.options?.timeoutSeconds || 60
        timeout = setTimeout(resolve, ms * 1000)
      }),
      Promise.all([this.Book, this.BookReverse])
    ])

    if (!Array.isArray(bookData)) {
      throw new Error('Timeout fetching order book data')
    } else if (timeout) {
      clearTimeout(timeout)
    }

    const books = await Promise.all([
      LiquidityParser({
        books: [bookData[0]],
        trade: this.Params.trade,
        options: {
          verbose: this.Params.options?.verboseBookData || false,
          rates: this.Params.options?.rates === RatesInCurrency.from
            ? RatesInCurrency.from
            : RatesInCurrency.to
        }
      }),
      LiquidityParser({
        books: [bookData[1]],
        trade: this.Params.trade,
        options: {
          verbose: this.Params.options?.verboseBookData || false,
          rates: this.Params.options?.rates === RatesInCurrency.from
            ? RatesInCurrency.to
            : RatesInCurrency.from
        }
      })
    ])

    const errors = this.detectErrors(books)

    const finalBookLine = books[0].filter(l => l._Capped !== undefined).slice(-1)[0]
    const rate = finalBookLine?._CumulativeRate_Cap || finalBookLine?._CumulativeRate

    const response = {
      rate,
      safe: errors.length < 1,
      errors
    }

    if (this.Params.options?.includeBookData) {
      Object.assign(response, {
        books
      })
    }

    return response
  }
}

export {
  LiquidityCheck,
  RatesInCurrency,
  LiquidityCheckResult as Result,
  Options,
  LiquidityCheckParams as Params,
  Errors
}
