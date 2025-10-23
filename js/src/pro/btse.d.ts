import btseRest from '../btse.js';
import type { Int, OHLCV, Str, Strings, Ticker, OrderBook, Order, Trade, Tickers, Position, Balances, Dictionary } from '../base/types.js';
import Client from '../base/ws/Client.js';
export default class btse extends btseRest {
    describe(): any;
    requestId(): any;
    getUrl(isPrivate?: boolean, isOrderbook?: boolean, market?: any): string;
    authenticate(params?: {}): Promise<any>;
    ping(client: Client): {
        op: string;
    };
    handlePong(client: Client, message: any): any;
    handleMessage(client: Client, message: any): void;
    handleSubscriptionStatus(client: Client, message: any): any;
    handleAuthenticationMessage(client: Client, message: any): any;
    handleError(client: Client, message: any): boolean;
    /**
     * @method
     * @name btse#watchTicker
     * @description watches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    watchTicker(symbol: string, params?: {}): Promise<Ticker>;
    /**
     * @method
     * @name btse#watchTickers
     * @description watches a price ticker, a statistical calculation with the information calculated over the past 24 hours for all markets of a specific list
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    watchTickers(symbols?: Strings, params?: {}): Promise<Tickers>;
    /**
     * @method
     * @name btse#unWatchTicker
     * @description unwatch a price ticker
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to unwatch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchTicker(symbol: string, params?: {}): Promise<any>;
    /**
     * @method
     * @name btse#unWatchTickers
     * @description unwatch price tickers
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified symbols of the markets to unwatch the tickers for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchTickers(symbols?: Strings, params?: {}): Promise<any>;
    handleTicker(client: Client, message: any): any;
    /**
     * @method
     * @name btse#watchOrderBook
     * @description watches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to fetch the order book for
     * @param {int} [limit] the maximum amount of order book entries to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.grouping] orderbook grouping level, '0', '1', '2', '3' (default '0')
     * @returns {object} A dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
     */
    watchOrderBook(symbol: string, limit?: Int, params?: {}): Promise<OrderBook>;
    /**
     * @method
     * @name btse#watchOrderBookForSymbols
     * @description watches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified array of symbols
     * @param {int} [limit] the maximum amount of order book entries to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.grouping] orderbook grouping level, '0', '1', '2', '3' (default '0')
     * @returns {object} A dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
     */
    watchOrderBookForSymbols(symbols: string[], limit?: Int, params?: {}): Promise<OrderBook>;
    /**
     * @method
     * @name btse#unWatchOrderBook
     * @description unwatch orderbook
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to unwatch the orderbook for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchOrderBook(symbol: string, params?: {}): Promise<any>;
    /**
     * @method
     * @name btse#unWatchOrderBookForSymbols
     * @description unwatch orderbook for symbols
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified symbols of the markets to unwatch the orderbooks for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchOrderBookForSymbols(symbols: string[], params?: {}): Promise<any>;
    handleOrderBook(client: Client, message: any): any;
    handleDeltas(bookSide: any, deltas: any): void;
    /**
     * @method
     * @name btse#watchTrades
     * @description get the list of most recent trades for a particular symbol
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to fetch trades for
     * @param {int} [since] timestamp in ms of the earliest trade to fetch
     * @param {int} [limit] the maximum amount of trades to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
     */
    watchTrades(symbol: string, since?: Int, limit?: Int, params?: {}): Promise<Trade[]>;
    /**
     * @method
     * @name btse#watchTradesForSymbols
     * @description get the list of most recent trades for a particular symbol
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified symbols of the markets to fetch trades for
     * @param {int} [since] timestamp in ms of the earliest trade to fetch
     * @param {int} [limit] the maximum amount of trades to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
     */
    watchTradesForSymbols(symbols: string[], since?: Int, limit?: Int, params?: {}): Promise<Trade[]>;
    /**
     * @method
     * @name btse#unWatchTrades
     * @description unwatch trades
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to unwatch trades for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchTrades(symbol: string, params?: {}): Promise<any>;
    /**
     * @method
     * @name btse#unWatchTradesForSymbols
     * @description unwatch trades for symbols
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified symbols of the markets to unwatch trades for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchTradesForSymbols(symbols: string[], params?: {}): Promise<any>;
    handleTrades(client: Client, message: any): any;
    /**
     * @method
     * @name btse#watchOHLCV
     * @description watches historical candlestick data containing the open, high, low, and close price, and the volume of a market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to fetch OHLCV data for
     * @param {string} timeframe the length of time each candle represents
     * @param {int} [since] timestamp in ms of the earliest candle to fetch
     * @param {int} [limit] the maximum amount of candles to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
     */
    watchOHLCV(symbol: string, timeframe?: string, since?: Int, limit?: Int, params?: {}): Promise<OHLCV[]>;
    /**
     * @method
     * @name btse#watchOHLCVForSymbols
     * @description watches historical candlestick data containing the open, high, low, and close price, and the volume of a market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[][]} symbolsAndTimeframes array of arrays containing unified symbols and timeframes to fetch OHLCV data for, example [['BTC/USDT', '1m'], ['LTC/USDT', '5m']]
     * @param {int} [since] timestamp in ms of the earliest candle to fetch
     * @param {int} [limit] the maximum amount of candles to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
     */
    watchOHLCVForSymbols(symbolsAndTimeframes: string[][], since?: Int, limit?: Int, params?: {}): Promise<Dictionary<Dictionary<OHLCV[]>>>;
    /**
     * @method
     * @name btse#unWatchOHLCV
     * @description unwatch OHLCV
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to unwatch OHLCV for
     * @param {string} timeframe the length of time each candle represents
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchOHLCV(symbol: string, timeframe?: string, params?: {}): Promise<any>;
    /**
     * @method
     * @name btse#unWatchOHLCVForSymbols
     * @description unwatch OHLCV for symbols
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[][]} symbolsAndTimeframes array of arrays containing unified symbols and timeframes
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchOHLCVForSymbols(symbolsAndTimeframes: string[][], params?: {}): Promise<any>;
    handleOHLCV(client: Client, message: any): any;
    /**
     * @method
     * @name btse#watchOrders
     * @description watches information on multiple orders made by the user
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} [symbol] unified market symbol of the market orders were made in
     * @param {int} [since] the earliest time in ms to fetch orders for
     * @param {int} [limit] the maximum number of order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    watchOrders(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Order[]>;
    /**
     * @method
     * @name btse#unWatchOrders
     * @description unwatch orders
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} [symbol] unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchOrders(symbol?: Str, params?: {}): Promise<any>;
    handleOrders(client: Client, message: any): any;
    /**
     * @method
     * @name btse#watchMyTrades
     * @description watches information on multiple trades made by the user
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} [symbol] unified market symbol of the market trades were made in
     * @param {int} [since] the earliest time in ms to fetch trades for
     * @param {int} [limit] the maximum number of trade structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
     */
    watchMyTrades(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Trade[]>;
    /**
     * @method
     * @name btse#unWatchMyTrades
     * @description unwatch my trades
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} [symbol] unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchMyTrades(symbol?: Str, params?: {}): Promise<any>;
    handleMyTrades(client: Client, message: any): any;
    /**
     * @method
     * @name btse#watchPositions
     * @description watch all open positions
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]|undefined} symbols list of unified market symbols
     * @param {int} [since] the earliest time in ms to fetch positions for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [position structures]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    watchPositions(symbols?: Strings, since?: Int, params?: {}): Promise<Position[]>;
    /**
     * @method
     * @name btse#unWatchPositions
     * @description unwatch positions
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} [symbols] list of unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchPositions(symbols?: Strings, params?: {}): Promise<any>;
    handlePositions(client: Client, message: any): any;
    /**
     * @method
     * @name btse#watchBalance
     * @description watch balance and get the amount of funds available for trading or funds locked in orders
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
     */
    watchBalance(params?: {}): Promise<Balances>;
    /**
     * @method
     * @name btse#unWatchBalance
     * @description unwatch balance
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    unWatchBalance(params?: {}): Promise<any>;
    handleBalance(client: Client, message: any): any;
}
