import { useState, useEffect, useContext } from "react";
import { NearContext } from "@/wallets/near";
import styles from "@/styles/app.module.css";
import { PriceOracleContract } from "../config";
import { providers } from "near-api-js";

const CONTRACT = PriceOracleContract;

// Mapping of asset IDs to their real-world decimals
const ASSET_DECIMALS = {
  "weth.fakes.testnet": 18,
  "dai.fakes.testnet": 18,
  "usdt.fakes.testnet": 6,
  "wrap.testnet": 18, // Assuming 18 as native wrapped token
  "usdc.fakes.testnet": 6,
  aurora: 18,
  "wbtc.fakes.testnet": 8,
  "usdn.testnet": 6,
  "aurora.fakes.testnet": 18,
  "woo.orderly.testnet": 18,
  "fraxtoken.testnet": 18,
  "s.fraxtoken.testnet": 18,
  "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af": 6, // Assuming USDC
};

export default function HelloNear() {
  const { wallet } = useContext(NearContext);
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(false);

  const callPriceFeed = async () => {
    try {
      setLoading(true);
      const outcome = await wallet.callMethod({
        contractId: CONTRACT,
        method: "query_price_feed",
      });
      localStorage.setItem("lastTransactionHash", outcome.transaction.hash);
    } catch (error) {
      console.error("Error calling price feed:", error);
      setLoading(false);
    }
  };

  const formatPrice = (price, assetId) => {
    if (!price) return "N/A";
    const { multiplier, decimals } = price;
    
    return ((Number(multiplier) * Math.pow(10, ASSET_DECIMALS[assetId])) / Math.pow(10, decimals)).toFixed(6);
  };

  const formatAssetId = (item) => {
    const id = item.asset_id.split('.')[0].toUpperCase();
    return id.length > 5 ? `${id.slice(0, 4)}...${id.slice(-2)}` : id;
  }

  useEffect(() => {
    const decodeSuccessValue = (successValue) => {
      const decodedString = Buffer.from(successValue, "base64").toString("utf-8");
      try {
        return JSON.parse(decodedString);
      } catch {
        return decodedString;
      }
    };

    const getTx = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const transactionHashes = urlParams.get("transactionHashes");

      if (transactionHashes) {
        const provider = new providers.JsonRpcProvider({
          url: "https://rpc.testnet.near.org",
        });

        const result = await provider.txStatus(
          transactionHashes,
          CONTRACT,
          "FINAL"
        );

        const priceData = decodeSuccessValue(
          result.receipts_outcome[1].outcome.status.SuccessValue
        );

        console.log(priceData);
        
        setPrices(priceData);
        setLoading(false);
        window.history.replaceState({}, '', window.location.pathname);
      }
    };
    if (wallet) getTx();
  }, [wallet]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>NEAR Price Feed</h1>
        
        <button 
          className={`${styles.button} ${loading ? styles.loading : ''}`}
          onClick={callPriceFeed}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Prices'}
        </button>

        {prices && (
          <div>
            <div className={styles.timestamp}>
              Last Updated: {new Date(Number(prices.timestamp) / 1000000).toLocaleString()}
            </div>
            
            <div className={styles.priceGrid}>
              {prices.prices.map((item) => (
                <div 
                  key={item.asset_id}
                  className={styles.priceCard}
                >
                  <h3 className={styles.assetName}>
                    {formatAssetId(item)}
                  </h3>
                  <p className={styles.price}>
                    ${formatPrice(item.price, item.asset_id)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!prices && !loading && (
          <div className={styles.message}>
            Click &ldquo;Refresh Prices&ldquo; to load the latest prices
          </div>
        )}
      </div>
    </main>
  );
}
