import {Trade, Offer} from '../types/XrplObjects'
import type Client from 'rippled-ws-client'

export enum RatesInCurrency {
  to = 'to',
  from = 'from'
}

export enum Errors {
  REQUESTED_LIQUIDITY_NOT_AVAILABLE = 'REQUESTED_LIQUIDITY_NOT_AVAILABLE',
  REVERSE_LIQUIDITY_NOT_AVAILABLE = 'REVERSE_LIQUIDITY_NOT_AVAILABLE',
  MAX_SPREAD_EXCEEDED = 'MAX_SPREAD_EXCEEDED',
  MAX_SLIPPAGE_EXCEEDED = 'MAX_SLIPPAGE_EXCEEDED',
  MAX_REVERSE_SLIPPAGE_EXCEEDED = 'MAX_REVERSE_SLIPPAGE_EXCEEDED',
  INSUFFICIENT_AMOUNT_OF_OFFERS = 'INSUFFICIENT_AMOUNT_OF_OFFERS'
}

export interface Options {
  timeoutSeconds?: number // Default: 60
  includeBookData?: boolean // Default: false
  verboseBookData?: boolean // Default: false
  rates?: RatesInCurrency
  maxSpreadPercentage?: number
  maxSlippagePercentage?: number
  maxSlippagePercentageReverse?: number
  maxBookLines?: number // Default: 500
  minOfferCount?: number
}

export interface Params {
  trade: Trade,
  options: Options
  method: Client['send']
}

export interface Result {
  rate: number
  safe: boolean
  errors: Array<Errors>
  books?: Offer[]
}
