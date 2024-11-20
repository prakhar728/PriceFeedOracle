// Find all our documentation at https://docs.near.org
use near_sdk::{env, log, near, AccountId, Gas, PanicOnDefault, Promise, PromiseError};

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

    // Public - query external greeting
    pub fn query_price_feed(&self) -> Promise {
        // Create a promise to call HelloNEAR.get_greeting()
        let promise = price_oracle::ext(self.price_oracle.clone())
            .with_static_gas(Gas::from_tgas(5))
            .get_price_data();

        return promise.then(
            // Create a promise to callback query_price_data_callback
            Self::ext(env::current_account_id())
                .with_static_gas(Gas::from_tgas(5))
                .query_price_data_callback(),
        );
    }

    #[private] // Public - but only callable by env::current_account_id()
    pub fn query_price_data_callback(
        &self,
        #[callback_result] call_result: Result<String, PromiseError>,
    ) -> String {
        // Check if the promise succeeded by calling the method outlined in external.rs
        if call_result.is_err() {
            log!("There was an error contacting Price Feed");
            return "".to_string();
        }

        // Return the greeting
        let greeting: String = call_result.unwrap();
        greeting
    }
}

/*
 * The rest of this file holds the inline tests for the code above
 * Learn more about Rust tests: https://doc.rust-lang.org/book/ch11-01-writing-tests.html
 */
// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[test]
//     fn get_default_greeting() {
//         let contract = Contract::default();
//         // this test did not call set_greeting so should return the default "Hello" greeting
//         assert_eq!(contract.get_greeting(), "Hello");
//     }

//     #[test]
//     fn set_then_get_greeting() {
//         let mut contract = Contract::default();
//         contract.set_greeting("howdy".to_string());
//         assert_eq!(contract.get_greeting(), "howdy");
//     }
// }
