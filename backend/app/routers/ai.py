from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.models import User
from app.schemas.schemas import SymptomAnalysisRequest, SymptomAnalysisResponse
from app.services.ai_service import analyze_symptoms

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze-symptoms", response_model=SymptomAnalysisResponse)
async def analyze_symptoms_endpoint(
    payload: SymptomAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    result = await analyze_symptoms(payload.symptoms, payload.age, payload.gender)
    return SymptomAnalysisResponse(**result)
