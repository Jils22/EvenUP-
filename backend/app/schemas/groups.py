from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class GroupCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)


class MemberOut(BaseModel):
    id: str
    name: str
    email: str


class GroupOut(BaseModel):
    id: str
    name: str
    created_by: str
    members: list[MemberOut] = []


class AddMemberRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        if isinstance(value, str):
            return value.strip().lower()
        return value