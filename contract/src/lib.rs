use near_sdk::serde_json;
use near_sdk::{env, log, near, AccountId, Gas, PanicOnDefault, Promise, PromiseError}; // Add this import

pub mod external;
pub use crate::external::*;

// Define the contract structure
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    pub price_oracle: AccountId,
}

// Implement the contract structure
#[near]
impl Contract {
    #[init]
    #[private] // Public - but only callable by env::current_account_id()
    pub fn init(price_oracle: AccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self { price_oracle }
    }

    pub fn query_price_feed(&self) -> Promise {
        price_oracle::ext(self.price_oracle.clone())
            .with_static_gas(Gas::from_tgas(5))
            .get_price_data(None)
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(Gas::from_tgas(5))
                    .query_price_data_callback(),
            )
    }

    #[private]
    pub fn query_price_data_callback(
        &self,
        #[callback_result] call_result: Result<PriceData, PromiseError>
    ) -> String {
        if call_result.is_err() {
            log!("There was an error contacting Price Feed");
            return "Error fetching price data".to_string();
        }

        let price_data = call_result.unwrap();
        // Convert PriceData to JSON string
        match serde_json::to_string(&price_data) {
            Ok(json_string) => json_string,
            Err(_) => "Error serializing price data".to_string()
        }
    }
}
