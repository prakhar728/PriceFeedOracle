use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{
    ext_contract,
    json_types::{U128, U64},
    serde::{self, Deserialize, Serialize},
    Timestamp,
};

pub const NO_DEPOSIT: u128 = 0;
pub const XCC_SUCCESS: u64 = 1;
pub type DurationSec = u32;
pub type AssetId = String;
pub type Balance = u128;

// Helper module for u128 serialization
mod u128_dec_format {
    use near_sdk::serde::{self, Deserialize, Deserializer, Serializer};
    
    pub fn serialize<S>(num: &u128, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&num.to_string())
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<u128, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s: String = Deserialize::deserialize(deserializer)?;
        s.parse().map_err(serde::de::Error::custom)
    }
}

// Helper module for u64 serialization
mod u64_dec_format {
    use near_sdk::serde::{self, Deserialize, Deserializer, Serializer};
    
    pub fn serialize<S>(num: &u64, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&num.to_string())
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<u64, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s: String = Deserialize::deserialize(deserializer)?;
        s.parse().map_err(serde::de::Error::custom)
    }
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Copy)]
#[cfg_attr(not(target_arch = "wasm32"), derive(Debug))]
#[serde(crate = "near_sdk::serde")]
pub struct Price {
    #[serde(with = "u128_dec_format")]
    pub multiplier: Balance,
    pub decimals: u8,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AssetOptionalPrice {
    pub asset_id: AssetId,
    pub price: Option<Price>,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct PriceData {
    #[serde(with = "u64_dec_format")]
    pub timestamp: Timestamp,
    pub recency_duration_sec: DurationSec,
    pub prices: Vec<AssetOptionalPrice>,
}

#[ext_contract(price_oracle)]
trait PriceOracle {
    fn get_price_data(&self, asset_ids: Option<Vec<AssetId>>) -> PriceData;
}