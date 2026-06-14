from pydantic import BaseModel


class RegisterSchema(BaseModel):
    username: str
    password: str
    full_name: str | None = None


class LoginSchema(BaseModel):
    username: str
    password: str


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    username: str
    full_name: str | None

    model_config = {
        "from_attributes": True
    }
