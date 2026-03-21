use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use std::time::Duration;
use serde::Serialize;
use tokio::sync::OnceCell;

static PRODUCER: OnceCell<FutureProducer> = OnceCell::const_new();

pub async fn get_producer() -> Option<&'static FutureProducer> {
    PRODUCER.get_or_init(|| async {
        let brokers = std::env::var("KAFKA_BROKERS").unwrap_or_else(|_| "redpanda:9092".to_string());
        ClientConfig::new()
            .set("bootstrap.servers", &brokers)
            .set("message.timeout.ms", "5000")
            .create()
            .expect("Producer creation error")
    }).await;
    PRODUCER.get()
}

pub async fn send_state_update<T: Serialize>(topic: &str, key: &str, payload: &T) -> Result<(), String> {
    let producer = match get_producer().await {
        Some(p) => p,
        None => return Err("Kafka producer not initialized".to_string()),
    };

    let payload_json = serde_json::to_string(payload)
        .map_err(|e| format!("Serialization error: {}", e))?;

    let record = FutureRecord::to(topic)
        .payload(&payload_json)
        .key(key);

    producer.send(record, Duration::from_secs(0))
        .await
        .map_err(|(e, _)| format!("Kafka error: {}", e))?;

    Ok(())
}
