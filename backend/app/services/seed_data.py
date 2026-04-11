"""
Seed data service for generating realistic test data.
Provides bulk data generation for inventory, customers, and sales.
"""

import random
from datetime import datetime, timezone, timedelta
from typing import Any


class SeedDataGenerator:
    """Generates realistic test data for seeding."""

    # Categories for products
    PRODUCT_CATEGORIES = [
        "Electronics",
        "Clothing",
        "Food & Beverages",
        "Home & Garden",
        "Sports & Outdoors",
        "Books",
        "Toys",
        "Health & Beauty",
    ]

    # Product names by category
    PRODUCT_NAMES = {
        "Electronics": [
            "Wireless Mouse",
            "USB-C Cable",
            "Phone Stand",
            "Lightning Charger",
            "Screen Protector",
            "Phone Case",
            "Laptop Cooling Pad",
            "HDMI Cable",
            "Power Bank",
            "Wireless Charger",
        ],
        "Clothing": [
            "Cotton T-Shirt",
            "Jeans",
            "Running Shoes",
            "Winter Jacket",
            "Summer Dress",
            "Formal Shirt",
            "Sweater",
            "Shorts",
            "Summer Hat",
            "Scarf",
        ],
        "Food & Beverages": [
            "Green Tea",
            "Coffee Beans",
            "Dark Chocolate",
            "Granola Bar",
            "Almond Butter",
            "Honey",
            "Orange Juice",
            "Protein Powder",
            "Energy Drink",
            "Mixed Nuts",
        ],
        "Home & Garden": [
            "Plant Pot",
            "Garden Tool Set",
            "Bedsheet Set",
            "Pillow Cover",
            "Door Mat",
            "Table Lamp",
            "Bookshelf",
            "Wall Clock",
            "Towel Set",
            "Kitchen Organizer",
        ],
        "Sports & Outdoors": [
            "Yoga Mat",
            "Water Bottle",
            "Sports Bag",
            "Jump Rope",
            "Dumbbells Set",
            "Resistance Bands",
            "Tent",
            "Sleeping Bag",
            "Hiking Boots",
            "Bicycle Helmet",
        ],
        "Books": [
            "Python Programming",
            "Web Development Guide",
            "Data Science Handbook",
            "Business Strategy",
            "Personal Finance",
            "Science Fiction Novel",
            "Mystery Thriller",
            "Self-Help Guide",
            "Cooking Recipes",
            "Travel Guide",
        ],
        "Toys": [
            "Building Blocks",
            "Puzzle Set",
            "Action Figure",
            "Board Game",
            "Teddy Bear",
            "Remote Control Car",
            "Lego Set",
            "Doll House",
            "Action Camo Mask",
            "Coloring Book",
        ],
        "Health & Beauty": [
            "Face Wash",
            "Moisturizer",
            "Shampoo",
            "Deodorant",
            "Toothbrush Set",
            "Sunscreen",
            "Face Mask",
            "Hair Oil",
            "Lip Balm",
            "Bath Salt",
        ],
    }

    # Customer name components
    FIRST_NAMES = [
        "Raj", "Priya", "Amit", "Neha", "Karan", "Anjali", "Rohan", "Simran",
        "Arjun", "Divya", "Sanjay", "Pooja", "Vikram", "Aisha", "Nikhil", "Sara",
        "Aditya", "Zara", "Rahul", "Shreya", "Manish", "Ananya", "Siddharth",
        "Isha", "Akshay", "Riya", "Abhinav", "Kavya", "Aryan", "Dia",
    ]

    LAST_NAMES = [
        "Sharma", "Kumar", "Singh", "Patel", "Verma", "Gupta", "Desai", "Nair",
        "Iyer", "Menon", "Saxena", "Rao", "Bhat", "Agarwal", "Reddy", "Chopra",
        "Malhotra", "Kapoor", "Bhatnagar", "Pandey", "Mishra", "Srivastava",
        "Joshi", "Bose", "Thakur", "Kulkarni", "Sinha", "Ghosh", "Bhattacharya",
    ]

    # Email domains
    EMAIL_DOMAINS = [
        "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediff.com",
        "example.com", "business.com",
    ]

    # Phone number prefix for India
    PHONE_PREFIXES = ["98", "97", "96", "95", "94", "93", "92", "91"]

    @staticmethod
    def _utc_now() -> datetime:
        """Get current UTC datetime."""
        return datetime.now(timezone.utc)

    @staticmethod
    def _to_iso_utc(value: datetime) -> str:
        """Convert datetime to ISO UTC string."""
        return value.isoformat().replace("+00:00", "Z")

    @classmethod
    def generate_product(cls, user_id: str) -> dict[str, Any]:
        """Generate a realistic product document."""
        category = random.choice(cls.PRODUCT_CATEGORIES)
        name = random.choice(cls.PRODUCT_NAMES[category])
        
        # Add random suffix to make names unique
        if random.random() < 0.5:
            name = f"{name} - {random.choice(['Premium', 'Deluxe', 'Pro', 'Standard', 'Basic'])}"
        
        price = round(random.uniform(99, 5000), 2)
        stock = random.randint(0, 500)
        barcode = "".join(random.choices("0123456789", k=12))
        now = cls._utc_now()
        
        return {
            "userId": user_id,
            "name": name,
            "category": category,
            "price": price,
            "stock": stock,
            "barcode": barcode,
            "lowStockThreshold": random.randint(5, 50),
            "createdAt": now - timedelta(days=random.randint(0, 90)),
            "updatedAt": now,
        }

    @classmethod
    def generate_customer(cls, user_id: str) -> dict[str, Any]:
        """Generate a realistic customer document."""
        first_name = random.choice(cls.FIRST_NAMES)
        last_name = random.choice(cls.LAST_NAMES)
        name = f"{first_name} {last_name}"
        
        # Generate email
        email_local = name.lower().replace(" ", ".") + str(random.randint(100, 999))
        email = f"{email_local}@{random.choice(cls.EMAIL_DOMAINS)}"
        
        # Generate phone (Indian format)
        phone = f"+91 {random.choice(cls.PHONE_PREFIXES)}{random.randint(10000000, 99999999)}"
        
        now = cls._utc_now()
        
        return {
            "userId": user_id,
            "name": name,
            "email": email,
            "phone": phone,
            "totalCredit": round(random.uniform(0, 50000), 2),
            "dueAmount": round(random.uniform(0, 20000), 2),
            "createdAt": now - timedelta(days=random.randint(0, 180)),
            "updatedAt": now,
        }

    @classmethod
    def generate_sales_invoice(
        cls,
        user_id: str,
        product_ids: list[str],
        customer_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        """Generate a realistic sales invoice."""
        if not product_ids:
            raise ValueError("At least one product is required")
        
        now = cls._utc_now()
        invoice_date = now - timedelta(days=random.randint(0, 60))
        
        # Generate invoice number
        invoice_id = f"INV-{invoice_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        
        # Select random items
        num_items = random.randint(1, 5)
        selected_products = random.choices(product_ids, k=num_items)
        
        items = []
        subtotal = 0
        for product_id in selected_products:
            # Mock product data (in real scenario, fetch from DB)
            price = round(random.uniform(50, 2000), 2)
            quantity = random.randint(1, 10)
            item_total = round(price * quantity, 2)
            items.append({
                "productId": product_id,
                "name": f"Product {random.randint(1, 100)}",
                "price": price,
                "quantity": quantity,
                "stock": random.randint(0, 100),
                "itemTotal": item_total,
            })
            subtotal += item_total
        
        discount = round(random.uniform(0, subtotal * 0.1), 2) if random.random() < 0.3 else 0
        total = round(subtotal - discount, 2)
        
        # Determine payment method and customer
        payment_method = random.choice(["cash", "credit"])
        customer_id = None
        customer_name = None
        due_amount = None
        credit_until = None
        
        if payment_method == "credit" and customer_ids:
            customer_id = random.choice(customer_ids)
            customer_name = f"Customer {random.randint(1, 100)}"
            due_amount = total
            credit_until = (invoice_date + timedelta(days=random.randint(7, 60))).isoformat().replace("+00:00", "Z")
        
        return {
            "userId": user_id,
            "invoiceId": invoice_id,
            "shopName": "Main Store",
            "shopContact": "+91 9876543210",
            "dateTime": invoice_date,
            "items": items,
            "subtotal": subtotal,
            "discount": discount,
            "total": total,
            "paymentMethod": payment_method,
            "customerId": customer_id,
            "customerName": customer_name,
            "dueAmount": due_amount,
            "creditUntil": credit_until,
            "itemCount": len(items),
        }

    @classmethod
    def generate_bulk_products(cls, user_id: str, count: int = 100) -> list[dict[str, Any]]:
        """Generate multiple products."""
        return [cls.generate_product(user_id) for _ in range(count)]

    @classmethod
    def generate_bulk_customers(cls, user_id: str, count: int = 50) -> list[dict[str, Any]]:
        """Generate multiple customers."""
        return [cls.generate_customer(user_id) for _ in range(count)]

    @classmethod
    def generate_bulk_sales_invoices(
        cls,
        user_id: str,
        product_ids: list[str],
        customer_ids: list[str] | None = None,
        count: int = 150,
    ) -> list[dict[str, Any]]:
        """Generate multiple sales invoices."""
        if not product_ids:
            raise ValueError("At least one product is required")
        return [
            cls.generate_sales_invoice(user_id, product_ids, customer_ids)
            for _ in range(count)
        ]
