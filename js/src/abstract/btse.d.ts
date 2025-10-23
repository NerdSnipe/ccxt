import { implicitReturnType } from '../base/types.js';
import { Exchange as _Exchange } from '../base/Exchange.js';
interface Exchange {
    publicGetApiV23MarketSummary(params?: {}): Promise<implicitReturnType>;
    publicGetApiV23Ohlcv(params?: {}): Promise<implicitReturnType>;
    publicGetApiV23Price(params?: {}): Promise<implicitReturnType>;
    publicGetApiV23Orderbook(params?: {}): Promise<implicitReturnType>;
    publicGetApiV23Trades(params?: {}): Promise<implicitReturnType>;
    publicSpotGetApiV32MarketSummary(params?: {}): Promise<implicitReturnType>;
    publicSpotGetApiV32Ohlcv(params?: {}): Promise<implicitReturnType>;
    publicSpotGetApiV32Price(params?: {}): Promise<implicitReturnType>;
    publicSpotGetApiV32OrderbookL2(params?: {}): Promise<implicitReturnType>;
    publicSpotGetApiV32Trades(params?: {}): Promise<implicitReturnType>;
    privateGetApiV23UserWallet(params?: {}): Promise<implicitReturnType>;
    privateGetApiV23UserWalletHistory(params?: {}): Promise<implicitReturnType>;
    privateGetApiV23UserOpenOrders(params?: {}): Promise<implicitReturnType>;
    privateGetApiV23UserPositions(params?: {}): Promise<implicitReturnType>;
    privateGetApiV23UserTradeHistory(params?: {}): Promise<implicitReturnType>;
    privatePostApiV23Order(params?: {}): Promise<implicitReturnType>;
    privatePostApiV23UserWalletTransfer(params?: {}): Promise<implicitReturnType>;
    privatePostApiV23Leverage(params?: {}): Promise<implicitReturnType>;
    privatePostApiV23PositionMode(params?: {}): Promise<implicitReturnType>;
    privatePutApiV23Order(params?: {}): Promise<implicitReturnType>;
    privateDeleteApiV23Order(params?: {}): Promise<implicitReturnType>;
}
declare abstract class Exchange extends _Exchange {
}
export default Exchange;
