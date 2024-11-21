import { useState, useEffect, useContext } from "react";
import { NearContext } from "@/wallets/near";
import styles from "@/styles/app.module.css";
import { HelloNearContract } from "../../config";
import { providers } from "near-api-js";

const CONTRACT = HelloNearContract;

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

  const formatPrice = (price) => {
    if (!price) return "N/A";
    const { multiplier, decimals } = price;
    return (Number(multiplier) / Math.pow(10, decimals)).toFixed(6);
  };

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
                    {item.asset_id.split('.')[0].toUpperCase()}
                  </h3>
                  <p className={styles.price}>
                    ${formatPrice(item.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!prices && !loading && (
          <div className={styles.message}>
            Click "Refresh Prices" to load the latest prices
          </div>
        )}
      </div>
    </main>
  );
}