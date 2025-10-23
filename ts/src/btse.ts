//  ---------------------------------------------------------------------------

import Exchange from './abstract/btse.js';
import { TICK_SIZE } from './base/functions/number.js';
import { AuthenticationError, BadSymbol, DuplicateOrderId, ExchangeError, ExchangeNotAvailable, InsufficientFunds, InvalidNonce, InvalidOrder, OrderNotFound, PermissionDenied, RateLimitExceeded } from './base/errors.js';
import { sha384 } from './static_dependencies/noble-hashes/sha512.js';
import type { Balances, Currency, Dict, Int, Market, Order, OrderSide, OrderType, Position, Str, TransferEntry, int } from './base/types.js';

//  ---------------------------------------------------------------------------

/**
 * @class btse
 * @augments Exchange
 */
export default class btse extends Exchange {
    nonce () {
        return this.milliseconds ();
    }

    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'btse',
            'name': 'BTSE',
            'countries': [ 'KY' ],
            'rateLimit': 67,
            'version': 'v2.3',
            'certified': false,
            'pro': false,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': true,
                'future': true,
                'option': false,
                'cancelAllOrders': true,
                'cancelOrder': true,
                'createOrder': true,
                'editOrder': true,
                'fetchBalance': true,
                'fetchCurrencies': false,
                'fetchMarkets': true,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchPositions': true,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTrades': true,
                'fetchTransfers': false,
                'sandbox': true,
                'setLeverage': true,
                'setMarginMode': false,
                'transfer': true,
            },
            'features': {
                'swap': {
                    'linear': {
                        'sandbox': true,
                        'createOrder': {
                            'marginMode': false,
                            'triggerPrice': true,
                            'triggerPriceType': undefined,
                            'triggerDirection': false,
                            'stopLossPrice': true,
                            'takeProfitPrice': true,
                            'attachedStopLossTakeProfit': undefined,
                            'timeInForce': {
                                'GTC': true,
                                'IOC': true,
                                'FOK': true,
                                'PO': true,
                                'GTD': false,
                            },
                            'postOnly': true,
                            'reduceOnly': true,
                            'hedged': false,
                            'trailing': false,
                            'iceberg': false,
                            'leverage': false,
                            'marketBuyRequiresPrice': false,
                            'marketBuyByCost': true,
                        },
                        'createOrders': {
                            'max': 1,
                        },
                        'fetchMyTrades': {
                            'marginMode': false,
                            'limit': 500,
                            'daysBack': undefined,
                            'untilDays': undefined,
                            'symbolRequired': false,
                        },
                        'fetchOrder': {
                            'marginMode': false,
                            'trigger': false,
                            'trailing': false,
                            'symbolRequired': true,
                        },
                        'fetchOpenOrders': {
                            'marginMode': false,
                            'limit': undefined,
                            'trigger': false,
                            'trailing': false,
                            'symbolRequired': false,
                        },
                        'fetchOrders': undefined,
                        'fetchClosedOrders': undefined,
                        'fetchOHLCV': {
                            'limit': undefined,
                        },
                    },
                },
            },
            'timeframes': {
                '1m': '1',
                '5m': '5',
                '15m': '15',
                '30m': '30',
                '1h': '60',
                '2h': '120',
                '4h': '240',
                '6h': '360',
                '12h': '720',
                '1d': '1440',
                '3d': '4320',
                '1w': '10080',
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/104117773-c7b2f880-52f4-11eb-8f2c-c21a4c626a32.jpg',
                'test': {
                    'public': 'https://testapi.btse.io/futures',
                    'private': 'https://testapi.btse.io/futures',
                    'publicSpot': 'https://testapi.btse.io/spot',
                    'privateSpot': 'https://testapi.btse.io/spot',
                },
                'api': {
                    'public': 'https://api.btse.com/futures',
                    'private': 'https://api.btse.com/futures',
                    'publicSpot': 'https://api.btse.com/spot',
                    'privateSpot': 'https://api.btse.com/spot',
                },
                'www': 'https://www.btse.com',
                'doc': [
                    'https://btsecom.github.io/docs/futuresV2_3/en/',
                    'https://btsecom.github.io/docs/spotV3_3/en/',
                ],
                'fees': 'https://www.btse.com/en/fees',
            },
            'api': {
                'public': {
                    'get': [
                        'api/v2.3/market_summary',
                        'api/v2.3/ohlcv',
                        'api/v2.3/price',
                        'api/v2.3/orderbook',
                        'api/v2.3/trades',
                    ],
                },
                'publicSpot': {
                    'get': [
                        'api/v3.2/market_summary',
                        'api/v3.2/ohlcv',
                        'api/v3.2/price',
                        'api/v3.2/orderbook/L2',
                        'api/v3.2/trades',
                    ],
                },
                'private': {
                    'get': [
                        'api/v2.3/user/wallet',
                        'api/v2.3/user/wallet_history',
                        'api/v2.3/user/open_orders',
                        'api/v2.3/user/positions',
                        'api/v2.3/user/trade_history',
                    ],
                    'post': [
                        'api/v2.3/order',
                        'api/v2.3/user/wallet/transfer',
                        'api/v2.3/leverage',
                        'api/v2.3/position_mode',
                    ],
                    'put': [
                        'api/v2.3/order',
                    ],
                    'delete': [
                        'api/v2.3/order',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'tierBased': true,
                    'percentage': true,
                    'maker': this.parseNumber ('0.0006'),
                    'taker': this.parseNumber ('0.0010'),
                },
            },
            'exceptions': {
                'exact': {
                    'INVALID_SYMBOL': BadSymbol,
                    'SYMBOL_NOT_FOUND': BadSymbol,
                    'INSUFFICIENT_BALANCE': InsufficientFunds,
                    'INSUFFICIENT_MARGIN': InsufficientFunds,
                    'INVALID_ORDER_SIZE': InvalidOrder,
                    'INVALID_PRICE': InvalidOrder,
                    'ORDER_SIZE_TOO_SMALL': InvalidOrder,
                    'ORDER_SIZE_TOO_LARGE': InvalidOrder,
                    'PRICE_TOO_HIGH': InvalidOrder,
                    'PRICE_TOO_LOW': InvalidOrder,
                    'ORDER_NOT_FOUND': OrderNotFound,
                    'ORDER_ALREADY_FILLED': OrderNotFound,
                    'ORDER_ALREADY_CANCELLED': OrderNotFound,
                    'RATE_LIMIT_EXCEEDED': RateLimitExceeded,
                    'TOO_MANY_REQUESTS': RateLimitExceeded,
                    'INVALID_API_KEY': AuthenticationError,
                    'INVALID_SIGNATURE': AuthenticationError,
                    'API_KEY_EXPIRED': AuthenticationError,
                    'PERMISSION_DENIED': PermissionDenied,
                    'IP_RESTRICTED': PermissionDenied,
                    'MARKET_CLOSED': InvalidOrder,
                    'MAINTENANCE_MODE': ExchangeNotAvailable,
                    'INVALID_NONCE': InvalidNonce,
                    'DUPLICATE_ORDER_ID': DuplicateOrderId,
                },
                'broad': {
                    'rate limit': RateLimitExceeded,
                    'too many': RateLimitExceeded,
                    'insufficient': InsufficientFunds,
                    'invalid': InvalidOrder,
                    'not found': OrderNotFound,
                    'permission': PermissionDenied,
                    'authentication': AuthenticationError,
                    'signature': AuthenticationError,
                    'maintenance': ExchangeNotAvailable,
                },
            },
            'precisionMode': TICK_SIZE,
            'options': {
                'sandboxMode': false,
            },
        });
    }

    afterConstruct () {
        super.afterConstruct ();
        const whitelabelDomain = this.safeString (this.options, 'whitelabel_domain');
        if (whitelabelDomain !== undefined) {
            const testPublic = 'https://testapi.' + whitelabelDomain + '/futures';
            const testPrivate = 'https://testapi.' + whitelabelDomain + '/futures';
            const apiPublic = 'https://api.' + whitelabelDomain + '/futures';
            const apiPrivate = 'https://api.' + whitelabelDomain + '/futures';
            this.urls['test'] = {
                'public': testPublic,
                'private': testPrivate,
            };
            this.urls['api'] = {
                'public': apiPublic,
                'private': apiPrivate,
            };
        }
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        const request = '/' + this.implodeParams (path, params);
        let url = this.urls['api'][api] + request;
        const query = this.omit (params, this.extractParams (path));
        const isPublic = (api === 'public') || (api === 'publicSpot');
        if (isPublic) {
            if (Object.keys (query).length) {
                url += '?' + this.urlencode (query);
            }
        } else {
            this.checkRequiredCredentials ();
            const nonce = this.nonce ().toString ();
            let bodyStr = '';
            if (method === 'POST' || method === 'PUT') {
                if (Object.keys (query).length) {
                    body = this.json (query);
                    bodyStr = body;
                }
            } else if (Object.keys (query).length) {
                // Add query parameters to URL only, NOT to signature
                url += '?' + this.urlencode (query);
            }
            // Signature: path + nonce + body (query params NOT included in signature)
            const auth = request + nonce + bodyStr;
            const signature = this.hmac (this.encode (auth), this.encode (this.secret), sha384, 'hex');
            headers = {
                'request-api': this.apiKey,
                'request-nonce': nonce,
                'request-sign': signature,
                'Content-Type': 'application/json',
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code: int, reason: string, url: string, method: string, headers: Dict, body: string, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return undefined;
        }
        const errorCode = this.safeString (response, 'errorCode');
        const message = this.safeString (response, 'message', '');
        if (errorCode !== undefined) {
            const feedback = this.id + ' ' + body;
            this.throwExactlyMatchedException (this.exceptions['exact'], errorCode, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], message, feedback);
            throw new ExchangeError (feedback);
        }
        return undefined;
    }

    /**
     * @method
     * @name btse#fetchMarkets
     * @description retrieves data on all markets for btse
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#market-summary
     * @see https://btsecom.github.io/docs/spotV3_3/en/#market-summary
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} an array of objects representing market data
     */
    async fetchMarkets (params = {}): Promise<Market[]> {
        // Fetch both SPOT and FUTURES markets
        const promises = [
            this.publicGetApiV23MarketSummary (params), // FUTURES
            this.publicSpotGetApiV32MarketSummary (params), // SPOT
        ];
        const responses = await Promise.all (promises);
        const futuresResponse = responses[0];
        const spotResponse = responses[1];
        const result = [];
        // Parse FUTURES markets
        for (let i = 0; i < futuresResponse.length; i++) {
            const market = futuresResponse[i];
            const parsed = this.parseMarket (market);
            result.push (parsed);
        }
        // Parse SPOT markets
        for (let i = 0; i < spotResponse.length; i++) {
            const market = spotResponse[i];
            const parsed = this.parseMarket (market);
            result.push (parsed);
        }
        return result;
    }

    parseMarket (market): Market {
        const id = this.safeString (market, 'symbol');
        const baseId = this.safeString (market, 'base');
        const quoteId = this.safeString (market, 'quote');
        const base = this.safeCurrencyCode (baseId);
        const quote = this.safeCurrencyCode (quoteId);
        const active = this.safeBool (market, 'active', true);
        const minPriceIncrement = this.safeString (market, 'minPriceIncrement');
        const minSizeIncrement = this.safeString (market, 'minSizeIncrement');
        const minOrderSize = this.safeString (market, 'minOrderSize');
        const maxOrderSize = this.safeString (market, 'maxOrderSize');
        const contractSize = this.safeString (market, 'contractSize', '1');
        // Detect market type from data
        const futures = this.safeBool (market, 'futures', false);
        const type = futures ? 'swap' : 'spot';
        const spot = (type === 'spot');
        const swap = (type === 'swap');
        let symbol = undefined;
        let settle = undefined;
        let settleId = undefined;
        if (spot) {
            // SPOT: BTC/USDT
            symbol = base + '/' + quote;
            settle = undefined;
            settleId = undefined;
        } else {
            // FUTURES: BTC/USDT:USDT
            symbol = base + '/' + quote + ':' + quote;
            settle = quote;
            settleId = quoteId;
        }
        return {
            'id': id,
            'symbol': symbol,
            'base': base,
            'quote': quote,
            'settle': settle,
            'baseId': baseId,
            'quoteId': quoteId,
            'settleId': settleId,
            'type': type,
            'spot': spot,
            'margin': false,
            'swap': swap,
            'future': false,
            'option': false,
            'active': active,
            'contract': swap,
            'linear': swap ? true : undefined,
            'inverse': swap ? false : undefined,
            'contractSize': swap ? this.parseNumber (contractSize) : undefined,
            'expiry': undefined,
            'expiryDatetime': undefined,
            'strike': undefined,
            'optionType': undefined,
            'precision': {
                'amount': this.parseNumber (minSizeIncrement),
                'price': this.parseNumber (minPriceIncrement),
            },
            'limits': {
                'leverage': {
                    'min': undefined,
                    'max': undefined,
                },
                'amount': {
                    'min': this.parseNumber (minOrderSize),
                    'max': this.parseNumber (maxOrderSize),
                },
                'price': {
                    'min': this.parseNumber (minPriceIncrement),
                    'max': undefined,
                },
                'cost': {
                    'min': undefined,
                    'max': undefined,
                },
            },
            'created': undefined,
            'info': market,
        };
    }

    /**
     * @method
     * @name btse#fetchTicker
     * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#market-summary
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    async fetchTicker (symbol: string, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        let response = undefined;
        if (market['spot']) {
            response = await this.publicSpotGetApiV32MarketSummary (this.extend (request, params));
        } else {
            response = await this.publicGetApiV23MarketSummary (this.extend (request, params));
        }
        const ticker = this.safeDict (response, 0);
        return this.parseTicker (ticker, market);
    }

    parseTicker (ticker, market: Market = undefined) {
        const marketId = this.safeString (ticker, 'symbol');
        const symbol = this.safeSymbol (marketId, market);
        const last = this.safeString (ticker, 'last');
        const percentage = this.safeString (ticker, 'percentageChange');
        const baseVolume = this.safeString (ticker, 'volume');
        const high = this.safeString (ticker, 'high24Hr');
        const low = this.safeString (ticker, 'low24Hr');
        const bid = this.safeString (ticker, 'highestBid');
        const ask = this.safeString (ticker, 'lowestAsk');
        const size = this.safeString (ticker, 'size');
        return this.safeTicker ({
            'symbol': symbol,
            'timestamp': undefined,
            'datetime': undefined,
            'high': high,
            'low': low,
            'bid': bid,
            'bidVolume': undefined,
            'ask': ask,
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': undefined,
            'percentage': percentage,
            'average': undefined,
            'baseVolume': baseVolume,
            'quoteVolume': size,
            'info': ticker,
        }, market);
    }

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
    async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        let response = undefined;
        if (market['spot']) {
            response = await this.publicSpotGetApiV32OrderbookL2 (this.extend (request, params));
        } else {
            response = await this.publicGetApiV23Orderbook (this.extend (request, params));
        }
        const timestamp = this.safeInteger (response, 'timestamp');
        return this.parseOrderBook (response, symbol, timestamp, 'buyQuote', 'sellQuote', 'price', 'size');
    }

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
    async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
            'count': limit !== undefined ? limit : 100,
        };
        if (since !== undefined) {
            request['startTime'] = since;
        }
        const until = this.safeInteger (params, 'until');
        if (until !== undefined) {
            params = this.omit (params, 'until');
            request['endTime'] = until;
        }
        let response = undefined;
        if (market['spot']) {
            response = await this.publicSpotGetApiV32Trades (this.extend (request, params));
        } else {
            response = await this.publicGetApiV23Trades (this.extend (request, params));
        }
        return this.parseTrades (response, market, since, limit);
    }

    parseTrade (trade, market: Market = undefined) {
        const marketId = this.safeString (trade, 'symbol');
        const symbol = this.safeSymbol (marketId, market);
        const timestamp = this.safeInteger (trade, 'timestamp');
        const side = this.safeStringLower (trade, 'side');
        const priceString = this.safeString2 (trade, 'filledPrice', 'price');
        const amountString = this.safeString2 (trade, 'filledSize', 'size');
        const id = this.safeString2 (trade, 'tradeId', 'serialId');
        const orderId = this.safeString (trade, 'orderId');
        const feeAmount = this.safeString (trade, 'feeAmount');
        const feeCurrency = this.safeString (trade, 'feeCurrency');
        const fee = (feeAmount !== undefined) ? {
            'cost': feeAmount,
            'currency': this.safeCurrencyCode (feeCurrency),
        } : undefined;
        const costString = this.safeString (trade, 'total');
        return this.safeTrade ({
            'id': id,
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'type': undefined,
            'side': side,
            'order': orderId,
            'takerOrMaker': undefined,
            'price': priceString,
            'amount': amountString,
            'cost': costString,
            'fee': fee,
        }, market);
    }

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
    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
            'resolution': this.safeString (this.timeframes, timeframe, timeframe),
        };
        if (since !== undefined) {
            request['start'] = since;
        }
        const until = this.safeInteger (params, 'until');
        if (until !== undefined) {
            params = this.omit (params, 'until');
            request['end'] = until;
        }
        let response = undefined;
        if (market['spot']) {
            response = await this.publicSpotGetApiV32Ohlcv (this.extend (request, params));
        } else {
            response = await this.publicGetApiV23Ohlcv (this.extend (request, params));
        }
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    /**
     * @method
     * @name btse#fetchBalance
     * @description query for balance and get the amount of funds available for trading or funds locked in orders
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#wallet
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.wallet] wallet name, defaults to 'CROSS@'
     * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
     */
    async fetchBalance (params = {}): Promise<Balances> {
        await this.loadMarkets ();
        const wallet = this.safeString (params, 'wallet', 'CROSS@');
        const request: Dict = {
            'wallet': wallet,
        };
        const response = await this.privateGetApiV23UserWallet (this.extend (request, params));
        return this.parseBalance (response);
    }

    parseBalance (response): Balances {
        const result: Dict = {
            'info': response,
        };
        const wallets = this.safeList (response, 0, []);
        if (wallets.length === 0) {
            return this.safeBalance (result);
        }
        const wallet = this.safeDict (response, 0);
        const assets = this.safeList (wallet, 'assets', []);
        for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            const currencyId = this.safeString (asset, 'currency');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['total'] = this.safeString (asset, 'balance');
            result[code] = account;
        }
        const availableBalance = this.safeString (wallet, 'availableBalance');
        const marginBalance = this.safeString (wallet, 'marginBalance');
        if (availableBalance !== undefined || marginBalance !== undefined) {
            result['free'] = availableBalance;
            result['used'] = marginBalance;
            result['total'] = this.safeString (wallet, 'totalValue');
        }
        return this.safeBalance (result);
    }

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
    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: number = undefined, params = {}): Promise<Order> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const uppercaseType = type.toUpperCase ();
        const uppercaseSide = side.toUpperCase ();
        const request: Dict = {
            'symbol': market['id'],
            'side': uppercaseSide,
            'type': uppercaseType,
            'size': this.amountToPrecision (symbol, amount),
        };
        if (uppercaseType === 'LIMIT') {
            if (price === undefined) {
                throw new InvalidOrder (this.id + ' createOrder() requires a price argument for limit orders');
            }
            request['price'] = this.priceToPrecision (symbol, price);
        }
        const timeInForce = this.safeString (params, 'timeInForce');
        if (timeInForce !== undefined) {
            request['time_in_force'] = timeInForce;
        }
        const postOnly = this.safeBool (params, 'postOnly');
        if (postOnly !== undefined) {
            request['postOnly'] = postOnly;
        }
        const reduceOnly = this.safeBool (params, 'reduceOnly');
        if (reduceOnly !== undefined) {
            request['reduceOnly'] = reduceOnly;
        }
        const triggerPrice = this.safeString (params, 'triggerPrice');
        if (triggerPrice !== undefined) {
            request['triggerPrice'] = this.priceToPrecision (symbol, triggerPrice);
        }
        const stopPrice = this.safeString (params, 'stopPrice');
        if (stopPrice !== undefined) {
            request['stopPrice'] = this.priceToPrecision (symbol, stopPrice);
        }
        const takeProfitPrice = this.safeString (params, 'takeProfitPrice');
        if (takeProfitPrice !== undefined) {
            request['takeProfitPrice'] = this.priceToPrecision (symbol, takeProfitPrice);
        }
        const stopLossPrice = this.safeString (params, 'stopLossPrice');
        if (stopLossPrice !== undefined) {
            request['stopLossPrice'] = this.priceToPrecision (symbol, stopLossPrice);
        }
        const clientOrderId = this.safeString (params, 'clOrderID');
        if (clientOrderId !== undefined) {
            request['clOrderID'] = clientOrderId;
        }
        params = this.omit (params, [ 'timeInForce', 'postOnly', 'reduceOnly', 'triggerPrice', 'stopPrice', 'takeProfitPrice', 'stopLossPrice', 'clOrderID' ]);
        const response = await this.privatePostApiV23Order (this.extend (request, params));
        const order = Array.isArray (response) ? response[0] : response;
        return this.parseOrder (order, market);
    }

    parseOrder (order, market: Market = undefined): Order {
        const marketId = this.safeString (order, 'symbol');
        const symbol = this.safeSymbol (marketId, market);
        const orderId = this.safeString (order, 'orderID');
        const clientOrderId = this.safeString (order, 'clOrderID');
        const timestamp = this.safeInteger (order, 'timestamp');
        const side = this.safeStringLower (order, 'side');
        const type = this.safeStringLower (order, 'type');
        const price = this.safeString (order, 'price');
        const amount = this.safeString (order, 'originalOrderSize');
        const filled = this.safeString (order, 'filledSize');
        const remaining = this.safeString (order, 'currentOrderSize');
        const status = this.parseOrderStatus (this.safeString (order, 'status'));
        const average = this.safeString (order, 'avgFillPrice');
        const timeInForce = this.safeString (order, 'timeInForce');
        const postOnly = this.safeBool (order, 'postOnly');
        const reduceOnly = this.safeBool (order, 'reduceOnly');
        const triggerPrice = this.safeString (order, 'triggerPrice');
        const stopPrice = this.safeString (order, 'stopPrice');
        return this.safeOrder ({
            'id': orderId,
            'clientOrderId': clientOrderId,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'status': status,
            'symbol': symbol,
            'type': type,
            'timeInForce': timeInForce,
            'postOnly': postOnly,
            'reduceOnly': reduceOnly,
            'side': side,
            'price': price,
            'stopPrice': stopPrice,
            'triggerPrice': triggerPrice,
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'cost': undefined,
            'average': average,
            'trades': undefined,
            'fee': undefined,
            'info': order,
        }, market);
    }

    parseOrderStatus (status) {
        const statuses: Dict = {
            '1': 'open',
            '2': 'open',
            '4': 'closed',
            '5': 'canceled',
            '6': 'open',
            '8': 'canceled',
            '9': 'canceled',
            '10': 'canceled',
            '15': 'rejected',
        };
        return this.safeString (statuses, status, status);
    }

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
    async cancelOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        if (symbol === undefined) {
            throw new InvalidOrder (this.id + ' cancelOrder() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        const clientOrderId = this.safeString (params, 'clOrderID');
        if (clientOrderId !== undefined) {
            request['clOrderID'] = clientOrderId;
            params = this.omit (params, 'clOrderID');
        } else {
            request['orderID'] = id;
        }
        const response = await this.privateDeleteApiV23Order (this.extend (request, params));
        return this.parseOrder (response, market);
    }

    /**
     * @method
     * @name btse#cancelAllOrders
     * @description cancel all open orders in a market
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#order-2
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async cancelAllOrders (symbol: Str = undefined, params = {}) {
        if (symbol === undefined) {
            throw new InvalidOrder (this.id + ' cancelAllOrders() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        const response = await this.privateDeleteApiV23Order (this.extend (request, params));
        if (Array.isArray (response)) {
            return this.parseOrders (response, market);
        }
        return [ this.parseOrder (response, market) ];
    }

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
    async editOrder (id: string, symbol: string, type: OrderType, side: OrderSide, amount: number = undefined, price: number = undefined, params = {}): Promise<Order> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
        };
        const clientOrderId = this.safeString (params, 'clOrderID');
        if (clientOrderId !== undefined) {
            request['clOrderID'] = clientOrderId;
            params = this.omit (params, 'clOrderID');
        } else {
            request['orderID'] = id;
        }
        const triggerPrice = this.safeString (params, 'triggerPrice');
        if (price !== undefined && amount !== undefined && triggerPrice !== undefined) {
            request['type'] = 'ALL';
            request['orderPrice'] = this.priceToPrecision (symbol, price);
            request['orderSize'] = this.amountToPrecision (symbol, amount);
            request['triggerPrice'] = this.priceToPrecision (symbol, triggerPrice);
            params = this.omit (params, 'triggerPrice');
        } else if (price !== undefined && amount !== undefined) {
            request['type'] = 'ALL';
            request['orderPrice'] = this.priceToPrecision (symbol, price);
            request['orderSize'] = this.amountToPrecision (symbol, amount);
        } else if (price !== undefined) {
            request['type'] = 'PRICE';
            request['value'] = this.priceToPrecision (symbol, price);
        } else if (amount !== undefined) {
            request['type'] = 'SIZE';
            request['value'] = this.amountToPrecision (symbol, amount);
        } else if (triggerPrice !== undefined) {
            request['type'] = 'TRIGGERPRICE';
            request['value'] = this.priceToPrecision (symbol, triggerPrice);
            params = this.omit (params, 'triggerPrice');
        } else {
            throw new InvalidOrder (this.id + ' editOrder() requires a price, amount, or triggerPrice argument');
        }
        const response = await this.privatePutApiV23Order (this.extend (request, params));
        return this.parseOrder (response, market);
    }

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
    async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {};
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        const response = await this.privateGetApiV23UserOpenOrders (this.extend (request, params));
        return this.parseOrders (response, market, since, limit);
    }

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
    async fetchOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        await this.loadMarkets ();
        const request: Dict = {};
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        const clientOrderId = this.safeString (params, 'clOrderID');
        if (clientOrderId !== undefined) {
            request['clOrderID'] = clientOrderId;
            params = this.omit (params, 'clOrderID');
        } else {
            request['orderID'] = id;
        }
        const response = await this.privateGetApiV23UserOpenOrders (this.extend (request, params));
        if (Array.isArray (response) && response.length > 0) {
            return this.parseOrder (response[0], market);
        }
        throw new OrderNotFound (this.id + ' fetchOrder() could not find order ' + id);
    }

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
    async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {};
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        if (since !== undefined) {
            request['startTime'] = since;
        }
        const until = this.safeInteger (params, 'until');
        if (until !== undefined) {
            request['endTime'] = until;
            params = this.omit (params, 'until');
        }
        if (limit !== undefined) {
            request['count'] = limit;
        }
        const orderID = this.safeString (params, 'orderID');
        if (orderID !== undefined) {
            request['orderID'] = orderID;
            params = this.omit (params, 'orderID');
        }
        const clOrderID = this.safeString (params, 'clOrderID');
        if (clOrderID !== undefined) {
            request['clOrderID'] = clOrderID;
            params = this.omit (params, 'clOrderID');
        }
        const includeOld = this.safeBool (params, 'includeOld');
        if (includeOld !== undefined) {
            request['includeOld'] = includeOld;
            params = this.omit (params, 'includeOld');
        }
        const response = await this.privateGetApiV23UserTradeHistory (this.extend (request, params));
        return this.parseTrades (response, market, since, limit);
    }

    /**
     * @method
     * @name btse#fetchPositions
     * @description fetch all open positions
     * @see https://btsecom.github.io/docs/futuresV2_3/en/#query-position
     * @param {string[]} [symbols] list of unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [position structure]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    async fetchPositions (symbols: string[] = undefined, params = {}) {
        await this.loadMarkets ();
        const response = await this.privateGetApiV23UserPositions (params);
        const result = [];
        for (let i = 0; i < response.length; i++) {
            const position = response[i];
            const parsed = this.parsePosition (position);
            result.push (parsed);
        }
        return this.filterByArrayPositions (result, 'symbol', symbols, false);
    }

    parsePosition (position, market: Market = undefined): Position {
        const marketId = this.safeString (position, 'symbol');
        market = this.safeMarket (marketId, market);
        const symbol = market['symbol'];
        const sideString = this.safeString (position, 'side');
        const side = (sideString === 'BUY') ? 'long' : 'short';
        const contractsString = this.safeString (position, 'size');
        const entryPriceString = this.safeString (position, 'entryPrice');
        const markPriceString = this.safeString (position, 'markPrice');
        const unrealizedPnl = this.safeString (position, 'unrealizedProfitLoss');
        const liquidationPrice = this.safeString (position, 'liquidationPrice');
        const notional = this.safeString (position, 'orderValue');
        const marginType = this.safeInteger (position, 'marginType');
        const marginMode = (marginType === 91) ? 'cross' : 'isolated';
        return this.safePosition ({
            'info': position,
            'id': this.safeString (position, 'positionId'),
            'symbol': symbol,
            'timestamp': undefined,
            'datetime': undefined,
            'initialMargin': undefined,
            'initialMarginPercentage': undefined,
            'maintenanceMargin': this.safeString (position, 'totalMaintenanceMargin'),
            'maintenanceMarginPercentage': undefined,
            'entryPrice': entryPriceString,
            'notional': notional,
            'leverage': undefined,
            'unrealizedPnl': unrealizedPnl,
            'contracts': contractsString,
            'contractSize': market['contractSize'],
            'marginRatio': undefined,
            'liquidationPrice': liquidationPrice,
            'markPrice': markPriceString,
            'collateral': undefined,
            'marginMode': marginMode,
            'side': side,
            'percentage': undefined,
        });
    }

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
    async setLeverage (leverage: number, symbol: Str = undefined, params = {}) {
        if (symbol === undefined) {
            throw new InvalidOrder (this.id + ' setLeverage() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'symbol': market['id'],
            'leverage': leverage,
        };
        const response = await this.privatePostApiV23Leverage (this.extend (request, params));
        return response;
    }

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
    async transfer (code: string, amount: number, fromAccount: string, toAccount: string, params = {}): Promise<TransferEntry> {
        await this.loadMarkets ();
        const currency = this.currency (code);
        const accountTypes: Dict = {
            'spot': 'SPOT',
            'cross': 'CROSS',
            'isolated': 'ISOLATED',
        };
        const fromType = this.safeString (accountTypes, fromAccount, fromAccount);
        const toType = this.safeString (accountTypes, toAccount, toAccount);
        const request: Dict = {
            'walletSrcType': fromType,
            'walletDestType': toType,
            'apiWallets': [
                {
                    'currency': currency['id'],
                    'balance': this.currencyToPrecision (code, amount),
                },
            ],
        };
        const response = await this.privatePostApiV23UserWalletTransfer (this.extend (request, params));
        return this.parseTransfer (response, currency);
    }

    parseTransfer (transfer: Dict, currency: Currency = undefined): TransferEntry {
        return {
            'info': transfer,
            'id': this.safeString (transfer, 'transferId'),
            'timestamp': this.safeInteger (transfer, 'timestamp'),
            'datetime': this.safeString (transfer, 'datetime'),
            'currency': this.safeCurrencyCode (undefined, currency),
            'amount': undefined,
            'fromAccount': undefined,
            'toAccount': undefined,
            'status': undefined,
        };
    }
}
