from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.rbac import get_current_user
from app.models.user import User, UserProfile
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    UserProfileUpdate,
    UserProfileResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Hash password
    hashed_pwd = get_password_hash(req.password)
    new_user = User(
        email=req.email.lower(),
        hashed_password=hashed_pwd,
        role=req.role,
        is_active=True
    )
    db.add(new_user)
    await db.flush()
    
    # Create profile
    profile = UserProfile(
        user_id=new_user.id,
        full_name=req.full_name,
        phone_number=req.phone_number,
        company_or_agency=req.company_or_agency,
        license_number=req.license_number
    )
    db.add(profile)
    await db.commit()
    await db.refresh(new_user)
    
    # Generate token
    token = create_access_token(subject=new_user.id, role=new_user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated"
        )
        
    token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id, full_name=current_user.email.split("@")[0])
        db.add(profile)
        
    if req.full_name is not None:
        profile.full_name = req.full_name
    if req.phone_number is not None:
        profile.phone_number = req.phone_number
    if req.avatar_url is not None:
        profile.avatar_url = req.avatar_url
    if req.bio is not None:
        profile.bio = req.bio
    if req.company_or_agency is not None:
        profile.company_or_agency = req.company_or_agency
    if req.license_number is not None:
        profile.license_number = req.license_number
        
    await db.commit()
    await db.refresh(profile)
    return UserProfileResponse.model_validate(profile)

@router.get("/users", response_model=list[UserResponse])
async def list_users(
    role: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.id != current_user.id, User.is_active == True)
    if role:
        query = query.where(User.role == role)
    result = await db.execute(query)
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]
