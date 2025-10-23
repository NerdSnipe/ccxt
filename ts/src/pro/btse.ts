
//  ---------------------------------------------------------------------------

import btseRest from '../btse.js';
import { AuthenticationError, ExchangeError, BadSymbol } from '../base/errors.js';
import { ArrayCacheBySymbolById, ArrayCacheByTimestamp } from '../base/ws/Cache.js';
import { sha384 } from '../static_dependencies/noble-hashes/sha512.js';
import type { Int, OHLCV, Str, Strings, Ticker, OrderBook, Order, Trade, Tickers, Position, Balances, Dict, Dictionary } from '../base/types.js';
import Client from '../base/ws/Client.js';

//  ---------------------------------------------------------------------------

export default class btse extends btseRest {
    describe (): any {
        return this.deepExtend (super.describe (), {
            'has': {
                'ws': true,
                // BTSE does NOT support WebSocket order placement/modification
                // Orders must be placed via REST API only
                'createOrderWs': false,
                'editOrderWs': false,
                'cancelOrderWs': false,
                'cancelAllOrdersWs': false,
                'watchBalance': true,
                'watchMyTrades': true,
                'watchOHLCV': true,
                'watchOHLCVForSymbols': true,
                'watchOrderBook': true,
                'watchOrderBookForSymbols': true,
                'watchOrders': true,
                'watchTicker': true,
                'watchTickers': true,
                'watchTrades': true,
                'watchTradesForSymbols': true,
                'watchPositions': true,
                'unWatchTicker': true,
                'unWatchTickers': true,
                'unWatchOHLCV': true,
                'unWatchOHLCVForSymbols': true,
                'unWatchOrderBook': true,
                'unWatchOrderBookForSymbols': true,
                'unWatchTrades': true,
                'unWatchTradesForSymbols': true,
                'unWatchMyTrades': true,
                'unWatchOrders': true,
                'unWatchPositions': true,
                'unWatchBalance': true,
            },
            'urls': {
                'api': {
                    'ws': {
                        'public': 'wss://ws.btse.com/ws/futures',
                        'orderbook': 'wss://ws.btse.com/ws/oss/futures',
                        'private': 'wss://ws.btse.com/ws/futures',
                        'publicSpot': 'wss://ws.btse.com/ws/spot',
                        'orderbookSpot': 'wss://ws.btse.com/ws/oss/spot',
                        'privateSpot': 'wss://ws.btse.com/ws/spot',
                    },
                },
                'test': {
                    'ws': {
                        'public': 'wss://testws.btse.io/ws/futures',
                        'orderbook': 'wss://testws.btse.io/ws/oss/futures',
                        'private': 'wss://testws.btse.io/ws/futures',
                        'publicSpot': 'wss://testws.btse.io/ws/spot',
                        'orderbookSpot': 'wss://testws.btse.io/ws/oss/spot',
                        'privateSpot': 'wss://testws.btse.io/ws/spot',
                    },
                },
            },
            'options': {
                'watchOrderBook': {
                    'grouping': '0', // default grouping level (0, 1, 2, 3)
                    'type': 'snapshotL2', // 'snapshotL1' or 'snapshotL2'
                },
                'watchPositions': {
                    'fetchPositionsSnapshot': true, // fetch initial snapshot via REST
                    'awaitPositionsSnapshot': true, // wait for snapshot before providing updates
                },
                'requestId': 0, // for generating unique request IDs
            },
            'streaming': {
                // BTSE does not respond to pings, so disable ping/pong keepalive
            },
        });
    }

    requestId () {
        const requestId = this.sum (this.safeInteger (this.options, 'requestId', 0), 1);
        this.options['requestId'] = requestId;
        return requestId;
    }

    getUrl (isPrivate = false, isOrderbook = false, market = undefined) {
        const urls = this.safeValue (this.urls, this.options['defaultType'], this.urls['api']);
        const ws = this.safeValue (urls, 'ws', {});
        // Determine if this is a SPOT market
        const isSpot = (market !== undefined) && this.safeValue (market, 'spot', false);
        // Select appropriate endpoint based on market type
        if (isOrderbook) {
            return this.safeString (ws, isSpot ? 'orderbookSpot' : 'orderbook');
        } else if (isPrivate) {
            return this.safeString (ws, isSpot ? 'privateSpot' : 'private');
        } else {
            return this.safeString (ws, isSpot ? 'publicSpot' : 'public');
        }
    }

    async authenticate (params = {}) {
        const url = this.getUrl (true);
        const client = this.client (url);
        const messageHash = 'authenticated';
        let future = this.safeValue (client.subscriptions, messageHash);
        if (future === undefined) {
            this.checkRequiredCredentials ();
            const nonce = this.nonce ();
            const path = '/ws/futures';
            const auth = path + nonce.toString ();
            const signature = this.hmac (this.encode (auth), this.encode (this.secret), sha384, 'hex');
            const request: Dict = {
                'op': 'authKeyExpires',
                'args': [
                    this.apiKey,
                    nonce,
                    signature,
                ],
            };
            future = await this.watch (url, messageHash, request, messageHash);
        }
        return future;
    }

    ping (client: Client) {
        return {
            'op': 'ping',
        };
    }

    handlePong (client: Client, message: any): any {
        // Message: { "op": "pong", "timestamp": 1680751558529 }
        client.lastPong = this.milliseconds ();
    }

    handleMessage (client: Client, message: any) {
        const topic = this.safeString (message, 'topic');
        const op = this.safeString (message, 'op');
        // Handle operational messages
        if (op === 'pong') {
            this.handlePong (client, message);
        } else if (op === 'subscribe' || op === 'unsubscribe') {
            this.handleSubscriptionStatus (client, message);
        } else if (op === 'authKeyExpires') {
            this.handleAuthenticationMessage (client, message);
        }
        // Handle data messages by topic
        if (topic !== undefined) {
            if (topic.indexOf ('ticker:') === 0) {
                this.handleTicker (client, message);
            } else if (topic.indexOf ('snapshotL1:') === 0 || topic.indexOf ('snapshotL2:') === 0) {
                this.handleOrderBook (client, message);
            } else if (topic === 'trades' || topic.indexOf ('trades:') === 0 || topic.indexOf ('tradeHistoryApi') === 0) {
                // BTSE FUTURES uses "tradeHistoryApiV3:BTC-PERP"
                // BTSE SPOT uses "tradeHistoryApi:BTC-USD"
                this.handleTrades (client, message);
            } else if (topic.indexOf ('kline:') === 0) {
                this.handleOHLCV (client, message);
            } else if (topic === 'orders') {
                this.handleOrders (client, message);
            } else if (topic === 'fills') {
                this.handleMyTrades (client, message);
            } else if (topic === 'positionsV3') {
                this.handlePositions (client, message);
            } else if (topic === 'wallet') {
                this.handleBalance (client, message);
            } else if (topic === 'error') {
                this.handleError (client, message);
            }
        }
    }

    handleSubscriptionStatus (client: Client, message: any): any {
        // Handle subscription/unsubscription confirmation
        return message;
    }

    handleAuthenticationMessage (client: Client, message: any): any {
        const messageHash = 'authenticated';
        const future = this.safeValue (client.subscriptions, messageHash);
        if (future !== undefined) {
            future.resolve (true);
        }
        return message;
    }

    handleError (client: Client, message: any): boolean {
        // Error format:
        // {
        //   "topic": "error",
        //   "code": 4001,
        //   "message": "Invalid symbol"
        // }
        const code = this.safeInteger (message, 'code');
        const errorMessage = this.safeString (message, 'message');
        if (code !== undefined) {
            if (code === 4001) {
                throw new BadSymbol (errorMessage);
            } else if (code === 4003) {
                throw new AuthenticationError (errorMessage);
            } else if (code === 4004) {
                throw new ExchangeError (errorMessage); // RateLimitExceeded
            }
            throw new ExchangeError (errorMessage);
        }
        return false;
    }

    /**
     * @method
     * @name btse#watchTicker
     * @description watches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    async watchTicker (symbol: string, params = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const url = this.getUrl (false, false, market);
        const messageHash = 'ticker:' + symbol;
        const topic = 'ticker:' + market['id'];
        const request: Dict = {
            'op': 'subscribe',
            'args': [ topic ],
        };
        return await this.watch (url, messageHash, request, messageHash);
    }

    /**
     * @method
     * @name btse#watchTickers
     * @description watches a price ticker, a statistical calculation with the information calculated over the past 24 hours for all markets of a specific list
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    async watchTickers (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols, undefined, false);
        const messageHashes = [];
        const topics = [];
        let firstMarket = undefined;
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const market = this.market (symbol);
            if (i === 0) {
                firstMarket = market;
            }
            const topic = 'ticker:' + market['id'];
            topics.push (topic);
            messageHashes.push ('ticker:' + symbol);
        }
        const url = this.getUrl (false, false, firstMarket);
        const request: Dict = {
            'op': 'subscribe',
            'args': topics,
        };
        const ticker = await this.watchMultiple (url, messageHashes, request, messageHashes);
        if (this.newUpdates) {
            const result: Dict = {};
            result[ticker['symbol']] = ticker;
            return result;
        }
        return this.filterByArray (this.tickers, 'symbol', symbols);
    }

    /**
     * @method
     * @name btse#unWatchTicker
     * @description unwatch a price ticker
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to unwatch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchTicker (symbol: string, params = {}): Promise<any> {
        return await this.unWatchTickers ([ symbol ], params);
    }

    /**
     * @method
     * @name btse#unWatchTickers
     * @description unwatch price tickers
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified symbols of the markets to unwatch the tickers for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchTickers (symbols: Strings = undefined, params = {}): Promise<any> {
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols, undefined, false);
        const topics = [];
        let firstMarket = undefined;
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const market = this.market (symbol);
            if (i === 0) {
                firstMarket = market;
            }
            const topic = 'ticker:' + market['id'];
            topics.push (topic);
        }
        const url = this.getUrl (false, false, firstMarket);
        const request: Dict = {
            'op': 'unsubscribe',
            'args': topics,
        };
        return await this.watch (url, 'unsubscribe:ticker', request, 'unsubscribe:ticker');
    }

    handleTicker (client: Client, message: any): any {
        //
        // {
        //   "topic": "ticker:BTC-PERP",
        //   "data": {
        //     "symbol": "BTC-PERP",
        //     "last": "28065.0",
        //     "lowestAsk": "28065.0",
        //     "highestBid": "28064.5",
        //     "volume24h": "123456.78",
        //     "high24h": "28500.0",
        //     "low24h": "27500.0",
        //     "timestamp": 1680751558529
        //   }
        // }
        //
        const data = this.safeDict (message, 'data', {});
        const ticker = this.parseTicker (data);
        const symbol = ticker['symbol'];
        this.tickers[symbol] = ticker;
        const messageHash = 'ticker:' + symbol;
        client.resolve (ticker, messageHash);
        return message;
    }

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
    async watchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const url = this.getUrl (false, true, market); // Use orderbook URL
        const options = this.safeValue (this.options, 'watchOrderBook', {});
        const grouping = this.safeString2 (params, 'grouping', 'group', this.safeString (options, 'grouping', '0'));
        const type = this.safeString (options, 'type', 'snapshotL2');
        const messageHash = 'orderbook:' + symbol;
        const topic = type + ':' + market['id'] + '_' + grouping;
        const request: Dict = {
            'op': 'subscribe',
            'args': [ topic ],
        };
        const orderbook = await this.watch (url, messageHash, request, messageHash);
        return orderbook.limit ();
    }

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
    async watchOrderBookForSymbols (symbols: string[], limit: Int = undefined, params = {}): Promise<OrderBook> {
        await this.loadMarkets ();
        const firstMarket = this.market (symbols[0]);
        const url = this.getUrl (false, true, firstMarket);
        const options = this.safeValue (this.options, 'watchOrderBook', {});
        const grouping = this.safeString2 (params, 'grouping', 'group', this.safeString (options, 'grouping', '0'));
        const type = this.safeString (options, 'type', 'snapshotL2');
        const messageHashes = [];
        const topics = [];
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const market = this.market (symbol);
            const topic = type + ':' + market['id'] + '_' + grouping;
            topics.push (topic);
            messageHashes.push ('orderbook:' + symbol);
        }
        const request: Dict = {
            'op': 'subscribe',
            'args': topics,
        };
        const orderbook = await this.watchMultiple (url, messageHashes, request, messageHashes);
        return orderbook.limit ();
    }

    /**
     * @method
     * @name btse#unWatchOrderBook
     * @description unwatch orderbook
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to unwatch the orderbook for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchOrderBook (symbol: string, params = {}): Promise<any> {
        return await this.unWatchOrderBookForSymbols ([ symbol ], params);
    }

    /**
     * @method
     * @name btse#unWatchOrderBookForSymbols
     * @description unwatch orderbook for symbols
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified symbols of the markets to unwatch the orderbooks for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchOrderBookForSymbols (symbols: string[], params = {}): Promise<any> {
        await this.loadMarkets ();
        const options = this.safeValue (this.options, 'watchOrderBook', {});
        const grouping = this.safeString2 (params, 'grouping', 'group', this.safeString (options, 'grouping', '0'));
        const type = this.safeString (options, 'type', 'snapshotL2');
        const topics = [];
        let firstMarket = undefined;
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const market = this.market (symbol);
            if (i === 0) {
                firstMarket = market;
            }
            const topic = type + ':' + market['id'] + '_' + grouping;
            topics.push (topic);
        }
        const url = this.getUrl (false, true, firstMarket);
        const request: Dict = {
            'op': 'unsubscribe',
            'args': topics,
        };
        return await this.watch (url, 'unsubscribe:orderbook', request, 'unsubscribe:orderbook');
    }

    handleOrderBook (client: Client, message: any): any {
        //
        // Snapshot:
        // {
        //   "topic": "snapshotL2:BTC-PERP_0",
        //   "data": {
        //     "bids": [["28064.5", "1250"], ["28064.0", "850"]],
        //     "asks": [["28065.0", "1015"], ["28065.5", "720"]],
        //     "type": "snapshot",
        //     "symbol": "BTC-PERP",
        //     "timestamp": 1680751558529,
        //     "prevSeqNum": 0,
        //     "seqNum": 12345
        //   }
        // }
        //
        // Delta:
        // {
        //   "topic": "snapshotL2:BTC-PERP_0",
        //   "data": {
        //     "bids": [["28064.5", "1300"]],
        //     "asks": [],
        //     "type": "delta",
        //     "symbol": "BTC-PERP",
        //     "timestamp": 1680751559000,
        //     "prevSeqNum": 12345,
        //     "seqNum": 12346
        //   }
        // }
        //
        const data = this.safeDict (message, 'data', {});
        const marketId = this.safeString (data, 'symbol');
        const market = this.safeMarket (marketId);
        const symbol = market['symbol'];
        const type = this.safeString (data, 'type');
        const timestamp = this.safeInteger (data, 'timestamp');
        const seqNum = this.safeInteger (data, 'seqNum');
        if (type === 'snapshot') {
            const snapshot = this.parseOrderBook (data, symbol, timestamp);
            snapshot['nonce'] = seqNum;
            let orderbook = this.safeValue (this.orderbooks, symbol);
            if (orderbook === undefined) {
                orderbook = this.orderBook (snapshot);
            } else {
                orderbook.reset (snapshot);
            }
            this.orderbooks[symbol] = orderbook;
        } else if (type === 'delta') {
            const orderbook = this.safeValue (this.orderbooks, symbol);
            if (orderbook === undefined) {
                // Wait for snapshot
                return message;
            }
            const bids = this.safeList (data, 'bids', []);
            const asks = this.safeList (data, 'asks', []);
            this.handleDeltas (orderbook['bids'], bids);
            this.handleDeltas (orderbook['asks'], asks);
            orderbook['nonce'] = seqNum;
            orderbook['timestamp'] = timestamp;
            orderbook['datetime'] = this.iso8601 (timestamp);
            this.orderbooks[symbol] = orderbook;
        }
        const messageHash = 'orderbook:' + symbol;
        client.resolve (this.orderbooks[symbol], messageHash);
        return message;
    }

    handleDeltas (bookSide, deltas) {
        for (let i = 0; i < deltas.length; i++) {
            const delta = deltas[i];
            const price = this.safeFloat (delta, 0);
            const amount = this.safeFloat (delta, 1);
            bookSide.store (price, amount);
        }
    }

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
    async watchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const url = this.getUrl (false, false, market);
        const messageHash = 'trades:' + symbol;
        // SPOT uses 'tradeHistoryApi:', FUTURES uses 'tradeHistoryApiV3:'
        const topicPrefix = market['spot'] ? 'tradeHistoryApi:' : 'tradeHistoryApiV3:';
        const topic = topicPrefix + market['id'];
        const request: Dict = {
            'op': 'subscribe',
            'args': [ topic ],
        };
        const trades = await this.watch (url, messageHash, request, messageHash);
        if (this.newUpdates) {
            limit = trades.getLimit (symbol, limit);
        }
        return this.filterBySinceLimit (trades, since, limit, 'timestamp', true);
    }

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
    async watchTradesForSymbols (symbols: string[], since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        await this.loadMarkets ();
        const messageHashes = [];
        const topics = [];
        let firstMarket = undefined;
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const market = this.market (symbol);
            if (i === 0) {
                firstMarket = market;
            }
            // SPOT uses 'tradeHistoryApi:', FUTURES uses 'tradeHistoryApiV3:'
            const topicPrefix = market['spot'] ? 'tradeHistoryApi:' : 'tradeHistoryApiV3:';
            const topic = topicPrefix + market['id'];
            topics.push (topic);
            messageHashes.push ('trades:' + symbol);
        }
        const url = this.getUrl (false, false, firstMarket);
        const request: Dict = {
            'op': 'subscribe',
            'args': topics,
        };
        const trades = await this.watchMultiple (url, messageHashes, request, messageHashes);
        if (this.newUpdates) {
            if (trades !== undefined) {
                const first = this.safeValue (trades, 0);
                const symbol = this.safeString (first, 'symbol');
                limit = trades.getLimit (symbol, limit);
            }
        }
        if (trades === undefined) {
            return [];
        }
        return this.filterBySinceLimit (trades, since, limit, 'timestamp', true);
    }

    /**
     * @method
     * @name btse#unWatchTrades
     * @description unwatch trades
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} symbol unified symbol of the market to unwatch trades for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchTrades (symbol: string, params = {}): Promise<any> {
        return await this.unWatchTradesForSymbols ([ symbol ], params);
    }

    /**
     * @method
     * @name btse#unWatchTradesForSymbols
     * @description unwatch trades for symbols
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} symbols unified symbols of the markets to unwatch trades for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchTradesForSymbols (symbols: string[], params = {}): Promise<any> {
        await this.loadMarkets ();
        const topics = [];
        let firstMarket = undefined;
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const market = this.market (symbol);
            if (i === 0) {
                firstMarket = market;
            }
            // SPOT uses 'tradeHistoryApi:', FUTURES uses 'tradeHistoryApiV3:'
            const topicPrefix = market['spot'] ? 'tradeHistoryApi:' : 'tradeHistoryApiV3:';
            const topic = topicPrefix + market['id'];
            topics.push (topic);
        }
        const url = this.getUrl (false, false, firstMarket);
        const request: Dict = {
            'op': 'unsubscribe',
            'args': topics,
        };
        return await this.watch (url, 'unsubscribe:trades', request, 'unsubscribe:trades');
    }

    handleTrades (client: Client, message: any): any {
        //
        // {
        //   "topic": "trades",
        //   "data": [{
        //     "symbol": "BTCPFC",  // Note: BTSE uses different symbols in WS vs REST
        //     "side": "BUY",
        //     "size": "0.5",
        //     "price": "28065.0",
        //     "tradeId": "abc123def",
        //     "timestamp": 1680751558529
        //   }]
        // }
        //
        const data = this.safeList (message, 'data', []);
        // BTSE sends "BTCPFC" for BTC-PERP in WebSocket messages
        // We need to find the correct market by looking at what we have in our markets
        const tradesArray = [];
        const symbolsByMarketId = {};
        for (let i = 0; i < data.length; i++) {
            const rawData = data[i];
            const marketId = this.safeString (rawData, 'symbol'); // e.g., "BTCPFC"
            // BTSE uses different symbols in WebSocket (BTCPFC) vs REST API (BTC-PERP)
            // We need to map the WS symbol to the correct market
            let market = undefined;
            if (marketId !== undefined && marketId.endsWith ('PFC')) {
                // For perpetual futures, remove "PFC" suffix and add "-PERP"
                const baseSymbol = marketId.replace ('PFC', '');
                const perpId = baseSymbol + '-PERP';
                market = this.safeMarket (perpId, undefined, undefined, 'swap');
            } else if (marketId !== undefined) {
                // For other symbols, try direct lookup
                market = this.safeMarket (marketId, undefined, undefined, 'swap');
            }
            const trade = this.parseTrade (rawData, market);
            tradesArray.push (trade);
            if (trade['symbol'] !== undefined) {
                symbolsByMarketId[marketId] = trade['symbol'];
            }
        }
        const first = this.safeValue (tradesArray, 0, {});
        const symbol = this.safeString (first, 'symbol');
        if (symbol === undefined) {
            return message;
        }
        let stored = this.safeValue (this.trades, symbol);
        if (stored === undefined) {
            const limit = this.safeInteger (this.options, 'tradesLimit', 1000);
            stored = new ArrayCacheBySymbolById (limit);
            this.trades[symbol] = stored;
        }
        // BTSE sends trades in descending order (newest first)
        // Reverse to ascending order (oldest first) as expected by CCXT
        tradesArray.reverse ();
        for (let i = 0; i < tradesArray.length; i++) {
            stored.append (tradesArray[i]);
        }
        const messageHash = 'trades:' + symbol;
        client.resolve (stored, messageHash);
        return message;
    }

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
    async watchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const url = this.getUrl (false, false, market);
        const messageHash = 'ohlcv:' + symbol + ':' + timeframe;
        const topic = 'kline:' + market['id'] + '_' + timeframe;
        const request: Dict = {
            'op': 'subscribe',
            'args': [ topic ],
        };
        const ohlcv = await this.watch (url, messageHash, request, messageHash);
        if (this.newUpdates) {
            limit = ohlcv.getLimit (symbol, limit);
        }
        return this.filterBySinceLimit (ohlcv, since, limit, 0, true);
    }

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
    async watchOHLCVForSymbols (symbolsAndTimeframes: string[][], since: Int = undefined, limit: Int = undefined, params = {}): Promise<Dictionary<Dictionary<OHLCV[]>>> {
        await this.loadMarkets ();
        const messageHashes = [];
        const topics = [];
        let firstMarket = undefined;
        for (let i = 0; i < symbolsAndTimeframes.length; i++) {
            const symbolAndTimeframe = symbolsAndTimeframes[i];
            const symbol = symbolAndTimeframe[0];
            const timeframe = symbolAndTimeframe[1];
            const market = this.market (symbol);
            if (i === 0) {
                firstMarket = market;
            }
            const topic = 'kline:' + market['id'] + '_' + timeframe;
            topics.push (topic);
            messageHashes.push ('ohlcv:' + symbol + ':' + timeframe);
        }
        const url = this.getUrl (false, false, firstMarket);
        const request: Dict = {
            'op': 'subscribe',
            'args': topics,
        };
        const ohlcv = await this.watchMultiple (url, messageHashes, request, messageHashes);
        if (this.newUpdates) {
            return ohlcv;
        }
        return this.filterBySinceLimit (ohlcv, since, limit, 0, true);
    }

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
    async unWatchOHLCV (symbol: string, timeframe = '1m', params = {}): Promise<any> {
        return await this.unWatchOHLCVForSymbols ([ [ symbol, timeframe ] ], params);
    }

    /**
     * @method
     * @name btse#unWatchOHLCVForSymbols
     * @description unwatch OHLCV for symbols
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[][]} symbolsAndTimeframes array of arrays containing unified symbols and timeframes
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchOHLCVForSymbols (symbolsAndTimeframes: string[][], params = {}): Promise<any> {
        await this.loadMarkets ();
        const topics = [];
        let firstMarket = undefined;
        for (let i = 0; i < symbolsAndTimeframes.length; i++) {
            const symbolAndTimeframe = symbolsAndTimeframes[i];
            const symbol = symbolAndTimeframe[0];
            const timeframe = symbolAndTimeframe[1];
            const market = this.market (symbol);
            if (i === 0) {
                firstMarket = market;
            }
            const topic = 'kline:' + market['id'] + '_' + timeframe;
            topics.push (topic);
        }
        const url = this.getUrl (false, false, firstMarket);
        const request: Dict = {
            'op': 'unsubscribe',
            'args': topics,
        };
        return await this.watch (url, 'unsubscribe:ohlcv', request, 'unsubscribe:ohlcv');
    }

    handleOHLCV (client: Client, message: any): any {
        //
        // {
        //   "topic": "kline:BTC-PERP_1m",
        //   "data": {
        //     "symbol": "BTC-PERP",
        //     "interval": "1m",
        //     "openTime": 1680751500000,
        //     "closeTime": 1680751559999,
        //     "open": "28050.0",
        //     "high": "28070.0",
        //     "low": "28045.0",
        //     "close": "28065.0",
        //     "volume": "125.5",
        //     "timestamp": 1680751559999
        //   }
        // }
        //
        const data = this.safeDict (message, 'data', {});
        const marketId = this.safeString (data, 'symbol');
        const market = this.safeMarket (marketId);
        const symbol = market['symbol'];
        const interval = this.safeString (data, 'interval');
        const timeframe = this.findTimeframe (interval);
        const parsed = [
            this.safeInteger (data, 'timestamp'),
            this.safeFloat (data, 'open'),
            this.safeFloat (data, 'high'),
            this.safeFloat (data, 'low'),
            this.safeFloat (data, 'close'),
            this.safeFloat (data, 'volume'),
        ];
        const messageHash = 'ohlcv:' + symbol + ':' + timeframe;
        let stored = this.safeValue (this.ohlcvs, symbol);
        if (stored === undefined) {
            stored = {};
            this.ohlcvs[symbol] = stored;
        }
        let storedArray = this.safeValue (stored, timeframe);
        if (storedArray === undefined) {
            const limit = this.safeInteger (this.options, 'OHLCVLimit', 1000);
            storedArray = new ArrayCacheByTimestamp (limit);
            stored[timeframe] = storedArray;
        }
        storedArray.append (parsed);
        client.resolve (storedArray, messageHash);
        return message;
    }

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
    async watchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        await this.loadMarkets ();
        await this.authenticate ();
        const url = this.getUrl (true);
        const messageHash = 'orders';
        const topic = 'orders';
        const request: Dict = {
            'op': 'subscribe',
            'args': [ topic ],
        };
        const orders = await this.watch (url, messageHash, request, messageHash);
        if (this.newUpdates) {
            limit = orders.getLimit (symbol, limit);
        }
        return this.filterBySymbolSinceLimit (orders, symbol, since, limit, true);
    }

    /**
     * @method
     * @name btse#unWatchOrders
     * @description unwatch orders
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} [symbol] unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchOrders (symbol: Str = undefined, params = {}): Promise<any> {
        await this.loadMarkets ();
        const url = this.getUrl (true);
        const topic = 'orders';
        const request: Dict = {
            'op': 'unsubscribe',
            'args': [ topic ],
        };
        return await this.watch (url, 'unsubscribe:orders', request, 'unsubscribe:orders');
    }

    handleOrders (client: Client, message: any): any {
        //
        // {
        //   "topic": "orders",
        //   "data": [{
        //     "orderId": "order123",
        //     "clientOrderId": "client456",
        //     "symbol": "BTC-PERP",
        //     "orderType": "LIMIT",
        //     "side": "BUY",
        //     "price": "28000.0",
        //     "size": "1.0",
        //     "filledSize": "0.5",
        //     "avgFillPrice": "28000.0",
        //     "status": "PARTIAL_FILLED",
        //     "triggerPrice": null,
        //     "timestamp": 1680751558529
        //   }]
        // }
        //
        const data = this.safeList (message, 'data', []);
        const ordersArray = [];
        for (let i = 0; i < data.length; i++) {
            const order = this.parseOrder (data[i]);
            ordersArray.push (order);
        }
        let stored = this.orders;
        if (stored === undefined) {
            const limit = this.safeInteger (this.options, 'ordersLimit', 1000);
            stored = new ArrayCacheBySymbolById (limit);
            this.orders = stored;
        }
        for (let i = 0; i < ordersArray.length; i++) {
            stored.append (ordersArray[i]);
        }
        const messageHash = 'orders';
        client.resolve (stored, messageHash);
        return message;
    }

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
    async watchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        await this.loadMarkets ();
        await this.authenticate ();
        const url = this.getUrl (true);
        const messageHash = 'myTrades';
        const topic = 'fills';
        const request: Dict = {
            'op': 'subscribe',
            'args': [ topic ],
        };
        const trades = await this.watch (url, messageHash, request, messageHash);
        if (this.newUpdates) {
            limit = trades.getLimit (symbol, limit);
        }
        return this.filterBySymbolSinceLimit (trades, symbol, since, limit, true);
    }

    /**
     * @method
     * @name btse#unWatchMyTrades
     * @description unwatch my trades
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string} [symbol] unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchMyTrades (symbol: Str = undefined, params = {}): Promise<any> {
        await this.loadMarkets ();
        const url = this.getUrl (true);
        const topic = 'fills';
        const request: Dict = {
            'op': 'unsubscribe',
            'args': [ topic ],
        };
        return await this.watch (url, 'unsubscribe:myTrades', request, 'unsubscribe:myTrades');
    }

    handleMyTrades (client: Client, message: any): any {
        //
        // {
        //   "topic": "fills",
        //   "data": [{
        //     "orderId": "order123",
        //     "tradeId": "trade789",
        //     "symbol": "BTC-PERP",
        //     "side": "BUY",
        //     "price": "28000.0",
        //     "size": "0.5",
        //     "fee": "0.00005",
        //     "feeCurrency": "BTC",
        //     "feeRate": "0.0001",
        //     "maker": false,
        //     "timestamp": 1680751558529
        //   }]
        // }
        //
        const data = this.safeList (message, 'data', []);
        const tradesArray = [];
        for (let i = 0; i < data.length; i++) {
            const trade = this.parseOrder (data[i]);
            tradesArray.push (trade);
        }
        let stored = this.myTrades;
        if (stored === undefined) {
            const limit = this.safeInteger (this.options, 'tradesLimit', 1000);
            stored = new ArrayCacheBySymbolById (limit);
            this.myTrades = stored;
        }
        for (let i = 0; i < tradesArray.length; i++) {
            stored.append (tradesArray[i]);
        }
        const messageHash = 'myTrades';
        client.resolve (stored, messageHash);
        return message;
    }

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
    async watchPositions (symbols: Strings = undefined, since: Int = undefined, params = {}): Promise<Position[]> {
        await this.loadMarkets ();
        await this.authenticate ();
        symbols = this.marketSymbols (symbols, undefined, false);
        const url = this.getUrl (true);
        const messageHash = 'positionsV3';
        const topic = 'positionsV3';
        const options = this.safeValue (this.options, 'watchPositions', {});
        const fetchPositionsSnapshot = this.safeBool (options, 'fetchPositionsSnapshot', true);
        const awaitPositionsSnapshot = this.safeBool (options, 'awaitPositionsSnapshot', true);
        if (fetchPositionsSnapshot && awaitPositionsSnapshot) {
            const snapshot = await this.fetchPositions (symbols);
            if (this.positions === undefined) {
                this.positions = new ArrayCacheBySymbolById ();
            }
            for (let i = 0; i < snapshot.length; i++) {
                this.positions.append (snapshot[i]);
            }
        }
        const request: Dict = {
            'op': 'subscribe',
            'args': [ topic ],
        };
        const positions = await this.watch (url, messageHash, request, messageHash);
        if (this.newUpdates) {
            return positions;
        }
        return this.filterBySymbolsSinceLimit (positions, symbols, since, undefined, true);
    }

    /**
     * @method
     * @name btse#unWatchPositions
     * @description unwatch positions
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {string[]} [symbols] list of unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchPositions (symbols: Strings = undefined, params = {}): Promise<any> {
        await this.loadMarkets ();
        const url = this.getUrl (true);
        const topic = 'positionsV3';
        const request: Dict = {
            'op': 'unsubscribe',
            'args': [ topic ],
        };
        return await this.watch (url, 'unsubscribe:positionsV3', request, 'unsubscribe:positionsV3');
    }

    handlePositions (client: Client, message: any): any {
        //
        // {
        //   "topic": "positionsV3",
        //   "data": [{
        //     "marketName": "QA-PERP-USDT",
        //     "entryPrice": 1500,
        //     "markedPrice": 1500,
        //     "liquidationPrice": 0,
        //     "unrealizedProfitLoss": 0,
        //     "totalContracts": 666,
        //     "marginTypeName": "FUTURES_MARGIN_CROSS",
        //     "currentLeverage": 0.0999085912,
        //     "positionId": "QA-PERP-USDT",
        //     "positionMode": "ONE_WAY",
        //     "positionDirection": "LONG",
        //     "contractSize": 0.01,
        //     "totalValue": 9990
        //   }]
        // }
        //
        const data = this.safeList (message, 'data', []);
        const positionsArray = [];
        for (let i = 0; i < data.length; i++) {
            const position = this.parsePosition (data[i]);
            positionsArray.push (position);
        }
        if (this.positions === undefined) {
            this.positions = new ArrayCacheBySymbolById ();
        }
        for (let i = 0; i < positionsArray.length; i++) {
            this.positions.append (positionsArray[i]);
        }
        const messageHash = 'positionsV3';
        client.resolve (this.positions, messageHash);
        return message;
    }

    /**
     * @method
     * @name btse#watchBalance
     * @description watch balance and get the amount of funds available for trading or funds locked in orders
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
     */
    async watchBalance (params = {}): Promise<Balances> {
        await this.loadMarkets ();
        await this.authenticate ();
        const url = this.getUrl (true);
        const messageHash = 'balance';
        const topic = 'wallet';
        const request: Dict = {
            'op': 'subscribe',
            'args': [ topic ],
        };
        return await this.watch (url, messageHash, request, messageHash);
    }

    /**
     * @method
     * @name btse#unWatchBalance
     * @description unwatch balance
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#websocket-streams
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {any} status
     */
    async unWatchBalance (params = {}): Promise<any> {
        await this.loadMarkets ();
        const url = this.getUrl (true);
        const topic = 'wallet';
        const request: Dict = {
            'op': 'unsubscribe',
            'args': [ topic ],
        };
        return await this.watch (url, 'unsubscribe:balance', request, 'unsubscribe:balance');
    }

    handleBalance (client: Client, message: any): any {
        //
        // {
        //   "topic": "wallet",
        //   "data": [{
        //     "currency": "USDT",
        //     "total": "10000.0",
        //     "available": "8500.0",
        //     "reserved": "1500.0",
        //     "timestamp": 1680751558529
        //   }, {
        //     "currency": "BTC",
        //     "total": "0.5",
        //     "available": "0.3",
        //     "reserved": "0.2",
        //     "timestamp": 1680751558529
        //   }]
        // }
        //
        const data = this.safeList (message, 'data', []);
        this.balance['info'] = message;
        for (let i = 0; i < data.length; i++) {
            const balance = data[i];
            const currencyId = this.safeString (balance, 'currency');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['free'] = this.safeString (balance, 'available');
            account['used'] = this.safeString (balance, 'reserved');
            account['total'] = this.safeString (balance, 'total');
            this.balance[code] = account;
        }
        this.balance = this.safeBalance (this.balance);
        const messageHash = 'balance';
        client.resolve (this.balance, messageHash);
        return message;
    }
}
