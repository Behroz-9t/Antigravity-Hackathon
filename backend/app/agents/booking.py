import uuid
from ..models.schemas import Provider, BookingResult, Intent

def simulate_booking(provider: Provider, intent: Intent) -> BookingResult:
    booking_id = f"BKG-{str(uuid.uuid4())[:8].upper()}"
    return BookingResult(
        booking_id=booking_id,
        status="CONFIRMED",
        provider=provider.provider_name,
        time_slot=intent.time
    )
