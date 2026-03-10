from fastapi import APIRouter
from models.schemas import CoachRequest, CoachResponse
from services.gemma import get_coach_response

router = APIRouter()


@router.post("/coach/respond", response_model=CoachResponse)
async def coach_respond(req: CoachRequest) -> CoachResponse:
    message = await get_coach_response(req)
    return CoachResponse(message=message)
