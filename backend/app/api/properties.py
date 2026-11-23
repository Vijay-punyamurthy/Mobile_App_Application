from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, delete
from typing import Optional, List
from app.database.session import get_db
from app.core.rbac import get_current_user, require_seller_or_broker
from app.models.user import User
from app.models.property import Property, PropertyImage, PropertyFavorite
from app.schemas.property import (
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse,
    PropertyImageResponse
)
from app.services.storage import save_upload_file

router = APIRouter(prefix="/properties", tags=["Land Marketplace & Listings"])

@router.get("", response_model=List[PropertyResponse])
async def list_properties(
    q: Optional[str] = Query(None, description="Search term for title, description, or address"),
    property_type: Optional[str] = Query(None, description="residential, agricultural, commercial, industrial"),
    status_filter: Optional[str] = Query("available", alias="status"),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("newest"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Property)
    
    conditions = []
    if status_filter and status_filter != "all":
        conditions.append(Property.status == status_filter)
    if property_type:
        conditions.append(Property.property_type == property_type)
    if city:
        conditions.append(Property.city.ilike(f"%{city}%"))
    if min_price is not None:
        conditions.append(Property.price >= min_price)
    if max_price is not None:
        conditions.append(Property.price <= max_price)
    if q:
        search_term = f"%{q}%"
        conditions.append(or_(
            Property.title.ilike(search_term),
            Property.description.ilike(search_term),
            Property.address.ilike(search_term),
            Property.city.ilike(search_term),
            Property.state.ilike(search_term)
        ))
        
    if conditions:
        query = query.where(and_(*conditions))
        
    if sort_by == "price_asc":
        query = query.order_by(Property.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Property.price.desc())
    else:
        query = query.order_by(Property.created_at.desc())
        
    result = await db.execute(query)
    properties = result.scalars().all()
    
    response = []
    for prop in properties:
        p_dict = PropertyResponse.model_validate(prop)
        response.append(p_dict)
    return response

@router.get("/user/my-listings", response_model=List[PropertyResponse])
async def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Property).where(Property.owner_id == current_user.id).order_by(Property.created_at.desc()))
    properties = result.scalars().all()
    return [PropertyResponse.model_validate(p) for p in properties]

@router.get("/user/favorites", response_model=List[PropertyResponse])
async def get_my_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Property)
        .join(PropertyFavorite, PropertyFavorite.property_id == Property.id)
        .where(PropertyFavorite.user_id == current_user.id)
        .order_by(PropertyFavorite.created_at.desc())
    )
    properties = result.scalars().all()
    res = []
    for p in properties:
        model = PropertyResponse.model_validate(p)
        model.is_favorited = True
        res.append(model)
    return res

@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property_details(
    property_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property listing not found")
    return PropertyResponse.model_validate(prop)

@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    req: PropertyCreate,
    current_user: User = Depends(require_seller_or_broker),
    db: AsyncSession = Depends(get_db)
):
    # RBAC Check: Buyers cannot create listings
    if current_user.role not in ["seller", "broker"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyers are not permitted to create property listings."
        )
        
    new_prop = Property(
        owner_id=current_user.id,
        title=req.title,
        description=req.description,
        price=req.price,
        price_unit=req.price_unit,
        land_area=req.land_area,
        area_unit=req.area_unit,
        property_type=req.property_type,
        status=req.status,
        address=req.address,
        city=req.city,
        state=req.state,
        country=req.country,
        latitude=req.latitude,
        longitude=req.longitude,
        zoning_classification=req.zoning_classification
    )
    db.add(new_prop)
    await db.flush()
    
    if req.images:
        for idx, img in enumerate(req.images):
            prop_img = PropertyImage(
                property_id=new_prop.id,
                image_url=img.image_url,
                is_primary=(idx == 0 or img.is_primary),
                sort_order=idx
            )
            db.add(prop_img)
            
    await db.commit()
    await db.refresh(new_prop)
    return PropertyResponse.model_validate(new_prop)

@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: int,
    req: PropertyUpdate,
    current_user: User = Depends(require_seller_or_broker),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property listing not found")
        
    # Backend Authorization Check: User must be the owner, or a broker managing properties
    if prop.owner_id != current_user.id and current_user.role != "broker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this property listing."
        )
        
    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(prop, field, val)
        
    await db.commit()
    await db.refresh(prop)
    return PropertyResponse.model_validate(prop)

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: int,
    current_user: User = Depends(require_seller_or_broker),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property listing not found")
        
    if prop.owner_id != current_user.id and current_user.role != "broker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this property listing."
        )
        
    await db.delete(prop)
    await db.commit()
    return None

@router.post("/{property_id}/images", response_model=PropertyImageResponse)
async def upload_property_image(
    property_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_seller_or_broker),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property listing not found")
        
    if prop.owner_id != current_user.id and current_user.role != "broker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to upload images for this property."
        )
        
    image_url = await save_upload_file(file)
    prop_img = PropertyImage(
        property_id=prop.id,
        image_url=image_url,
        is_primary=(len(prop.images) == 0),
        sort_order=len(prop.images)
    )
    db.add(prop_img)
    await db.commit()
    await db.refresh(prop_img)
    return PropertyImageResponse.model_validate(prop_img)

@router.post("/{property_id}/favorite")
async def toggle_favorite(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Property).where(Property.id == property_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property listing not found")
        
    fav_result = await db.execute(
        select(PropertyFavorite).where(
            PropertyFavorite.property_id == property_id,
            PropertyFavorite.user_id == current_user.id
        )
    )
    fav = fav_result.scalar_one_or_none()
    
    if fav:
        await db.delete(fav)
        await db.commit()
        return {"property_id": property_id, "is_favorited": False}
    else:
        new_fav = PropertyFavorite(property_id=property_id, user_id=current_user.id)
        db.add(new_fav)
        await db.commit()
        return {"property_id": property_id, "is_favorited": True}
