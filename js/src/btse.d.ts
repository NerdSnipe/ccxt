import Exchange from './abstract/btse.js';
import type { Balances, Currency, Dict, Int, Market, Order, OrderSide, OrderType, Position, Str, TransferEntry, int } from './base/types.js';
/**
 * @class btse
 * @augments Exchange
 */
export default class btse extends Exchange {
    nonce(): number;
    describe(): any;
    afterConstruct(): void;
    sign(path: any, api?: string, method?: string, params?: {}, headers?: any, body?: any): {
        url: string;
        method: string;
        body: any;
        headers: any;
    };
    handleErrors(code: int, reason: string, url: string, method: string, headers: Dict, body: string, response: any, requestHeaders: any, requestBody: any): any;
    /**
     * @method
     * @name btse#fetchMarkets
     * @description retrieves data on all markets for btse
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#market-summary
     * @see https://btsecom.github.io/docs/spotV3_3/en/#market-summary
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} an array of objects representing market data
     */
    fetchMarkets(params?: {}): Promise<Market[]>;
    parseMarket(market: any): Market;
    /**
     * @method
     * @name btse#fetchTicker
     * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#market-summary
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    fetchTicker(symbol: string, params?: {}): Promise<import("./base/types.js").Ticker>;
    parseTicker(ticker: any, market?: Market): import("./base/types.js").Ticker;
    /**
     * @method
     * @name btse#fetchOrderBook
     * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#orderbook
     * @param {string} symbol unified symbol of the market to fetch the order book for
     * @param {int} [limit] the maximum amount of order book entries to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.group] orderbook grouping level (0-8)
     * @returns {object} A dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
     */
    fetchOrderBook(symbol: string, limit?: Int, params?: {}): Promise<import("./base/types.js").OrderBook>;
    /**
     * @method
     * @name btse#fetchTrades
     * @description get the list of most recent trades for a particular symbol
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#trades
     * @param {string} symbol unified symbol of the market to fetch trades for
     * @param {int} [since] timestamp in ms of the earliest trade to fetch
     * @param {int} [limit] the maximum amount of trades to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.until] timestamp in ms of the latest trade to fetch
     * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
     */
    fetchTrades(symbol: string, since?: Int, limit?: Int, params?: {}): Promise<import("./base/types.js").Trade[]>;
    parseTrade(trade: any, market?: Market): import("./base/types.js").Trade;
    /**
     * @method
     * @name btse#fetchOHLCV
     * @description fetches historical candlestick data containing the open, high, low, close price, and the volume of a market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#ohlcv
     * @param {string} symbol unified symbol of the market to fetch OHLCV data for
     * @param {string} timeframe the length of time each candle represents
     * @param {int} [since] timestamp in ms of the earliest candle to fetch
     * @param {int} [limit] the maximum amount of candles to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.until] timestamp in ms of the latest candle to fetch
     * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
     */
    fetchOHLCV(symbol: string, timeframe?: string, since?: Int, limit?: Int, params?: {}): Promise<import("./base/types.js").OHLCV[]>;
    /**
     * @method
     * @name btse#fetchBalance
     * @description query for balance and get the amount of funds available for trading or funds locked in orders
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#wallet
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.wallet] wallet name, defaults to 'CROSS@'
     * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
     */
    fetchBalance(params?: {}): Promise<Balances>;
    parseBalance(response: any): Balances;
    /**
     * @method
     * @name btse#createOrder
     * @description create a trade order
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#order
     * @param {string} symbol unified symbol of the market to create an order in
     * @param {string} type 'market' or 'limit'
     * @param {string} side 'buy' or 'sell'
     * @param {float} amount how much you want to trade in units of the base currency
     * @param {float} [price] the price at which the order is to be fulfilled, in units of the quote currency, ignored in market orders
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.timeInForce] 'GTC', 'IOC', 'FOK', or 'PO'
     * @param {bool} [params.postOnly] true or false
     * @param {bool} [params.reduceOnly] true or false
     * @param {float} [params.triggerPrice] price to trigger stop orders
     * @param {float} [params.stopPrice] price for OCO orders
     * @param {float} [params.takeProfitPrice] take profit trigger price
     * @param {float} [params.stopLossPrice] stop loss trigger price
     * @param {string} [params.clOrderID] client order ID
     * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    createOrder(symbol: string, type: OrderType, side: OrderSide, amount: number, price?: number, params?: {}): Promise<Order>;
    parseOrder(order: any, market?: Market): Order;
    parseOrderStatus(status: any): string;
    /**
     * @method
     * @name btse#cancelOrder
     * @description cancels an open order
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#order-2
     * @param {string} id order id
     * @param {string} symbol unified symbol of the market the order was made in
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.clOrderID] client order id
     * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    cancelOrder(id: string, symbol?: Str, params?: {}): Promise<Order>;
    /**
     * @method
     * @name btse#cancelAllOrders
     * @description cancel all open orders in a market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#order-2
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    cancelAllOrders(symbol?: Str, params?: {}): Promise<Order[]>;
    /**
     * @method
     * @name btse#editOrder
     * @description edit a trade order
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#order-1
     * @param {string} id order id
     * @param {string} symbol unified symbol of the market to edit the order in
     * @param {string} type not used by btse editOrder
     * @param {string} side not used by btse editOrder
     * @param {float} [amount] how much you want to trade in units of the base currency
     * @param {float} [price] the price at which the order is to be fulfilled, in units of the quote currency
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {float} [params.triggerPrice] price to trigger stop orders
     * @param {string} [params.clOrderID] client order id
     * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    editOrder(id: string, symbol: string, type: OrderType, side: OrderSide, amount?: number, price?: number, params?: {}): Promise<Order>;
    /**
     * @method
     * @name btse#fetchOpenOrders
     * @description fetch all unfilled currently open orders
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#query-open-orders
     * @param {string} symbol unified market symbol
     * @param {int} [since] not used by btse fetchOpenOrders
     * @param {int} [limit] not used by btse fetchOpenOrders
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    fetchOpenOrders(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Order[]>;
    /**
     * @method
     * @name btse#fetchOrder
     * @description fetches information on an order made by the user
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#query-open-orders
     * @param {string} id order id
     * @param {string} symbol unified symbol of the market the order was made in
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.clOrderID] client order id
     * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    fetchOrder(id: string, symbol?: Str, params?: {}): Promise<Order>;
    /**
     * @method
     * @name btse#fetchMyTrades
     * @description fetch all trades made by the user
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#query-trades-fills
     * @param {string} symbol unified market symbol
     * @param {int} [since] timestamp in ms of the earliest trade to fetch
     * @param {int} [limit] the maximum number of trades to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.until] timestamp in ms of the latest trade to fetch
     * @param {string} [params.orderID] filter trades by order ID
     * @param {string} [params.clOrderID] filter trades by client order ID
     * @param {bool} [params.includeOld] include trades older than 7 days
     * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
     */
    fetchMyTrades(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<import("./base/types.js").Trade[]>;
    /**
     * @method
     * @name btse#fetchPositions
     * @description fetch all open positions
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#query-position
     * @param {string[]} [symbols] list of unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [position structure]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    fetchPositions(symbols?: string[], params?: {}): Promise<Position[]>;
    parsePosition(position: any, market?: Market): Position;
    /**
     * @method
     * @name btse#setLeverage
     * @description set the level of leverage for a market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#set-leverage
     * @param {float} leverage the rate of leverage
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} response from the exchange
     */
    setLeverage(leverage: number, symbol?: Str, params?: {}): Promise<any>;
    /**
     * @method
     * @name btse#transfer
     * @description transfer currency internally between wallets on the same account
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#wallet-transfer
     * @param {string} code unified currency code
     * @param {float} amount amount to transfer
     * @param {string} fromAccount account to transfer from
     * @param {string} toAccount account to transfer to
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [transfer structure]{@link https://docs.ccxt.com/#/?id=transfer-structure}
     */
    transfer(code: string, amount: number, fromAccount: string, toAccount: string, params?: {}): Promise<TransferEntry>;
    parseTransfer(transfer: Dict, currency?: Currency): TransferEntry;
}
