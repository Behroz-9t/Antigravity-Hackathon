from typing import List
from ..models.schemas import Provider, RankingResult

def rank_providers(providers: List[Provider]) -> RankingResult:
    if not providers:
        return None
        
    best_score = -1
    best_provider = None
    
    for p in providers:
        # Distance score (35%): closer is better, assume 15km is max for 0 score
        dist_score = max(0, 15 - p.distance_km) / 15.0 if p.distance_km else 0.5
        
        # Availability score (25%)
        avail_score = 1.0 if p.available else 0.0
        
        # Rating score (25%): rating out of 5
        rating_score = p.rating / 5.0
        
        # Response time score (15%): lower is better, assume 60 mins is max for 0 score
        resp_score = max(0, 60 - p.response_time_mins) / 60.0
        
        total_score = (dist_score * 0.35) + (avail_score * 0.25) + (rating_score * 0.25) + (resp_score * 0.15)
        p.score = round(total_score, 3)
        
        if total_score > best_score:
            best_score = total_score
            best_provider = p
            
    if best_provider:
        reasoning = f"Selected {best_provider.provider_name} as it has the highest score ({best_provider.score}). "
        if best_provider.distance_km < 3:
            reasoning += "It is very close to the location. "
        if best_provider.rating > 4.5:
            reasoning += "It is highly rated. "
        if best_provider.available:
            reasoning += "It is immediately available."
            
        return RankingResult(
            selected_provider=best_provider,
            reasoning=reasoning
        )
    return None
