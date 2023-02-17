import {Trade, Offer} from '../types/XrplObjects'

export enum RatesInCurrency {
  to = 'to',
  from = 'from'
}

export enum Errors {
  REQUESTED_LIQUIDITY_NOT_AVAILABLE = 'REQUESTED_LIQUIDITY_NOT_AVAILABLE',
  REVERSE_LIQUIDITY_NOT_AVAILABLE = 'REVERSE_LIQUIDITY_NOT_AVAILABLE',
  MAX_SPREAD_EXCEEDED = 'MAX_SPREAD_EXCEEDED',
  MAX_SLIPPAGE_EXCEEDED = 'MAX_SLIPPAGE_EXCEEDED',
  MAX_REVERSE_SLIPPAGE_EXCEEDED = 'MAX_REVERSE_SLIPPAGE_EXCEEDED'
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
}

interface _Params {
  trade: Trade,
  options: Options
}

export interface RippledWsClient extends _Params { 
  method: any
}

export interface XrplClient extends _Params { 
  client: any
}

export type Params = RippledWsClient | XrplClient

export interface Result {
  rate: number
  safe: boolean
  errors: Array<Errors>
  books?: Offer[]
}
