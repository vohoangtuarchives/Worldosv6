// Kafka stub — rdkafka removed for Replit compatibility.
// To enable real Kafka: add rdkafka dependency and replace this file.
use serde::Serialize;

pub async fn send_state_update<T: Serialize>(_topic: &str, _key: &str, _payload: &T) -> Result<(), String> {
    Ok(())
}
