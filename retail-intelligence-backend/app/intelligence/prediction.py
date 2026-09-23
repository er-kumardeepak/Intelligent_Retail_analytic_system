"""Queue prediction — explainable arithmetic, not a black box.

    predicted_queue = max(0, current_queue + (arrival_rate - service_rate) * minutes)

With 6 people waiting, 2.0 arrivals/min and 1.2 served/min, five minutes later:

    6 + (2.0 - 1.2) * 5 = 10 people

Every function here is pure (no database, no clock, no settings lookups beyond
explicit arguments), which keeps it unit-testable and keeps the numbers an
operator sees reproducible by hand.
"""

from __future__ import annotations

from datetime import datetime

from app.models.queues import QueuePrediction, QueueState

# Sensitivity of the trend label, in people per minute.
TREND_EPSILON = 0.15

# Fallback serving rate used only when the edge reports service_rate = 0 while a
# queue exists, so the wait estimate stays finite instead of dividing by zero.
FALLBACK_SERVICE_RATE = 1.0


def predict_queue_length(
    current_queue: int,
    arrival_rate: float,
    service_rate: float,
    minutes: float,
) -> int:
    """Project the queue length forward by ``minutes``."""
    projected = current_queue + (arrival_rate - service_rate) * minutes
    return max(0, int(round(projected)))


def net_growth_per_minute(arrival_rate: float, service_rate: float) -> float:
    """Positive means the queue is filling faster than it is being served."""
    return round(arrival_rate - service_rate, 4)


def queue_trend(growth_per_minute: float) -> str:
    if growth_per_minute > TREND_EPSILON:
        return "growing"
    if growth_per_minute < -TREND_EPSILON:
        return "clearing"
    return "stable"


def estimate_wait_minutes(
    queue_length: int,
    service_rate: float,
    open_counters: int = 1,
) -> float:
    """Little's law style estimate: wait = queue / throughput."""
    throughput = service_rate
    if throughput <= 0:
        throughput = FALLBACK_SERVICE_RATE * max(1, open_counters)
    return round(queue_length / throughput, 2)


def minutes_until_breach(
    current_queue: int,
    arrival_rate: float,
    service_rate: float,
    threshold: int,
) -> float | None:
    """Minutes until the queue reaches ``threshold``, or None if it never will."""
    growth = arrival_rate - service_rate
    if current_queue >= threshold:
        return 0.0
    if growth <= 0:
        return None
    return round((threshold - current_queue) / growth, 2)


def congestion_level(predicted_queue: int, threshold: int, open_counters: int = 1) -> str:
    """Map a projected queue onto the dashboard's severity language."""
    if predicted_queue >= threshold * 1.5:
        return "critical"
    if predicted_queue >= threshold:
        return "warning"
    if predicted_queue >= max(1, threshold - 2) and open_counters <= 1:
        return "watch"
    return "normal"


def explain_prediction(
    current_queue: int,
    arrival_rate: float,
    service_rate: float,
    minutes: float,
    predicted_queue: int,
) -> tuple[str, str]:
    """Return the (formula, sentence) pair shown to an operator."""
    formula = (
        f"max(0, {current_queue} + ({arrival_rate} - {service_rate}) * {minutes:g}) "
        f"= {predicted_queue}"
    )
    change = predicted_queue - current_queue
    if change > 0:
        movement = f"grows by {change} to about {predicted_queue}"
    elif change < 0:
        movement = f"clears by {abs(change)} to about {predicted_queue}"
    else:
        movement = f"holds at about {predicted_queue}"
    sentence = (
        f"{current_queue} people waiting with {arrival_rate:g}/min arriving and "
        f"{service_rate:g}/min served: the queue {movement} in {minutes:g} minutes."
    )
    return formula, sentence


def build_queue_prediction(
    state: QueueState,
    *,
    horizon_minutes: int,
    breach_threshold: int,
    timestamp: datetime | None = None,
) -> QueuePrediction:
    """Assemble the full, explainable prediction for a queue snapshot."""
    growth = net_growth_per_minute(state.arrival_rate, state.service_rate)
    predicted = predict_queue_length(
        state.queue_length, state.arrival_rate, state.service_rate, horizon_minutes
    )
    formula, sentence = explain_prediction(
        state.queue_length,
        state.arrival_rate,
        state.service_rate,
        horizon_minutes,
        predicted,
    )
    return QueuePrediction(
        store_id=state.store_id,
        camera_id=state.camera_id,
        timestamp=timestamp or state.timestamp,
        current_queue=state.queue_length,
        arrival_rate=state.arrival_rate,
        service_rate=state.service_rate,
        open_counters=state.open_counters,
        horizon_minutes=horizon_minutes,
        predicted_queue=predicted,
        net_growth_per_minute=growth,
        trend=queue_trend(growth),
        congestion_level=congestion_level(predicted, breach_threshold, state.open_counters),
        minutes_until_breach=minutes_until_breach(
            state.queue_length, state.arrival_rate, state.service_rate, breach_threshold
        ),
        breach_threshold=breach_threshold,
        estimated_wait_minutes=estimate_wait_minutes(
            state.queue_length, state.service_rate, state.open_counters
        ),
        formula=formula,
        explanation=sentence,
    )
