from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Request, Response, status
from pymongo.errors import DuplicateKeyError

from app.api.deps import get_mongo_db
from app.schemas.inventory import (
    AddInventoryProductRequest,
    InventoryListResponse,
    InventoryProduct,
    UpdateInventoryProductRequest,
    UpdateInventoryStockRequest,
)

router = APIRouter(prefix="/inventory")

_indexes_ready = False


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _to_iso_utc(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def _to_inventory_product(document: dict) -> InventoryProduct:
    return InventoryProduct(
        id=str(document["_id"]),
        name=document["name"],
        barcode=document["barcode"],
        stock=document["stock"],
        price=document["price"],
        category=document["category"],
        lowStockThreshold=document["lowStockThreshold"],
        createdAt=_to_iso_utc(document["createdAt"]),
        updatedAt=_to_iso_utc(document["updatedAt"]),
    )


def _get_user_id(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user_id


def _parse_object_id(product_id: str) -> ObjectId:
    try:
        return ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")


async def _ensure_indexes(collection) -> None:
    global _indexes_ready
    if _indexes_ready:
        return

    await collection.create_index([("userId", 1), ("barcode", 1)], unique=True)
    await collection.create_index([("userId", 1), ("category", 1)])
    await collection.create_index([("userId", 1), ("stock", 1)])
    await collection.create_index([("userId", 1), ("updatedAt", -1)])
    _indexes_ready = True


@router.get("", response_model=InventoryListResponse)
async def list_inventory(
    request: Request,
    search: str | None = None,
    category: str | None = None,
    lowStockOnly: bool | None = None,
):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    collection = database["inventory_items"]
    await _ensure_indexes(collection)

    query: dict = {"userId": user_id}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"barcode": {"$regex": search, "$options": "i"}},
        ]
    if category:
        query["category"] = category
    if lowStockOnly:
        query["$expr"] = {"$lte": ["$stock", "$lowStockThreshold"]}

    documents = await collection.find(query).sort("updatedAt", -1).to_list(length=None)
    products = [_to_inventory_product(document) for document in documents]
    total_count = await collection.count_documents(query)
    categories = sorted(await collection.distinct("category", {"userId": user_id}))

    return InventoryListResponse(products=products, totalCount=total_count, categories=categories)


@router.post("", response_model=InventoryProduct, status_code=status.HTTP_201_CREATED)
async def create_inventory_product(request: Request, payload: AddInventoryProductRequest):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    collection = database["inventory_items"]
    await _ensure_indexes(collection)

    now = _utc_now()
    document = {
        "userId": user_id,
        "name": payload.name,
        "barcode": payload.barcode,
        "stock": payload.stock,
        "price": payload.price,
        "category": payload.category,
        "lowStockThreshold": payload.lowStockThreshold,
        "createdAt": now,
        "updatedAt": now,
    }

    try:
        result = await collection.insert_one(document)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Barcode already exists")

    created = await collection.find_one({"_id": result.inserted_id, "userId": user_id})
    if created is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create product")

    return _to_inventory_product(created)


@router.put("/{product_id}", response_model=InventoryProduct)
async def update_inventory_product(product_id: str, request: Request, payload: UpdateInventoryProductRequest):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    collection = database["inventory_items"]
    await _ensure_indexes(collection)

    object_id = _parse_object_id(product_id)

    try:
        update_result = await collection.update_one(
            {"_id": object_id, "userId": user_id},
            {
                "$set": {
                    "name": payload.name,
                    "barcode": payload.barcode,
                    "stock": payload.stock,
                    "price": payload.price,
                    "category": payload.category,
                    "lowStockThreshold": payload.lowStockThreshold,
                    "updatedAt": _utc_now(),
                }
            },
        )
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Barcode already exists")

    if update_result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    updated = await collection.find_one({"_id": object_id, "userId": user_id})
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return _to_inventory_product(updated)


@router.patch("/{product_id}/stock", response_model=InventoryProduct)
async def update_inventory_stock(product_id: str, request: Request, payload: UpdateInventoryStockRequest):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    collection = database["inventory_items"]
    await _ensure_indexes(collection)

    object_id = _parse_object_id(product_id)

    update_result = await collection.update_one(
        {"_id": object_id, "userId": user_id},
        {
            "$set": {
                "stock": payload.stock,
                "updatedAt": _utc_now(),
            }
        },
    )

    if update_result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    updated = await collection.find_one({"_id": object_id, "userId": user_id})
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return _to_inventory_product(updated)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_product(product_id: str, request: Request):
    user_id = _get_user_id(request)
    database = get_mongo_db()
    if database is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    collection = database["inventory_items"]
    await _ensure_indexes(collection)

    object_id = _parse_object_id(product_id)

    delete_result = await collection.delete_one({"_id": object_id, "userId": user_id})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
