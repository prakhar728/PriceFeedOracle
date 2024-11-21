import { useState, useEffect, useContext } from "react";

import { NearContext } from "@/wallets/near";
import styles from "@/styles/app.module.css";
import { HelloNearContract } from "../../config";
import { Cards } from "@/components/cards";
import { providers } from "near-api-js";

// Contract that the app will interact with
const CONTRACT = HelloNearContract;

export default function HelloNear() {
  const { signedAccountId, wallet } = useContext(NearContext);

  const [greeting, setGreeting] = useState("loading...");
  const [newGreeting, setNewGreeting] = useState("loading...");
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    setLoggedIn(!!signedAccountId);
  }, [signedAccountId]);

  const saveGreeting = async () => {
    setShowSpinner(true);
    await wallet.callMethod({
      contractId: CONTRACT,
      method: "set_greeting",
      args: { greeting: newGreeting },
    });
    const greeting = await wallet.viewMethod({
      contractId: CONTRACT,
      method: "get_greeting",
    });
    setGreeting(greeting);
    setShowSpinner(false);
  };

  const callPriceFeed = async () => {
    try {
      // Instead of waiting for direct return, get transaction details
      const outcome = await wallet.callMethod({
        contractId: CONTRACT,
        method: "query_price_feed",
      });

      // Store transaction hash in localStorage before redirect
      localStorage.setItem("lastTransactionHash", outcome.transaction.hash);
    } catch (error) {
      console.error("Error calling price feed:", error);
    }
  };

  useEffect(() => {
    const decodeSuccessValue = (successValue) => {
      // Convert base64 to string
      const decodedString = Buffer.from(successValue, "base64").toString(
        "utf-8"
      );

      try {
        // Try to parse as JSON if it's a JSON string
        return JSON.parse(decodedString);
      } catch {
        // If not JSON, return the string as is
        return decodedString;
      }
    };

    const getTx = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const transactionHashes = urlParams.get("transactionHashes");

      console.log(transactionHashes);

      const provider = new providers.JsonRpcProvider({
        url: "https://rpc.testnet.near.org",
      });

      if (transactionHashes) {
        const result = await provider.txStatus(
          transactionHashes, // you might want to see if this is an array or what I am not sure.
          CONTRACT,
          "FINAL"
        );

        console.log(
          decodeSuccessValue(
            result.receipts_outcome[1].outcome.status.SuccessValue
          )
        );

        // Clean up URL
        // window.history.replaceState({}, '', window.location.pathname)
      }
    };
    if (wallet) getTx();
  }, [wallet]);

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          Interacting with the contract: &nbsp;
          <code className={styles.code}>{CONTRACT}</code>
        </p>
      </div>

      <div className={styles.center}>
        <h1 className="w-100">
          The contract says: <code>{greeting}</code>
        </h1>
        <div className="input-group" hidden={!loggedIn}>
          <input
            type="text"
            className="form-control w-20"
            placeholder="Store a new greeting"
            onChange={(t) => setNewGreeting(t.target.value)}
          />
          <div className="input-group-append">
            <button className="btn btn-secondary" onClick={saveGreeting}>
              <span hidden={showSpinner}> Save </span>
              <i
                className="spinner-border spinner-border-sm"
                hidden={!showSpinner}
              ></i>
            </button>
          </div>
        </div>
        <div className="w-100 text-end align-text-center" hidden={loggedIn}>
          <p className="m-0"> Please login to change the greeting </p>
        </div>
      </div>

      <div>
        Call price feed
        <button className="btn btn-secondary" onClick={callPriceFeed}>
          <span hidden={showSpinner}> Call </span>
        </button>
      </div>
      <Cards />
    </main>
  );
}
