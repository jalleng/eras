from pydantic import BaseModel


class PersonResponse(BaseModel):
    id: str
    name: str
