"""
CargoSync — Database Seeder Script

Populates the database with demo companies, fleet trucks, drivers,
and sample freight jobs with 3D cargo packages for testing and demonstration.

Run with:
    python seed.py
"""

import sys
import os
import uuid
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.deps import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.company import Company
from app.models.user import User
from app.models.admin import Admin
from app.models.truck import Truck
from app.models.driver import Driver
from app.models.job import Job
from app.models.box import Box
from app.models.delivery import Delivery
from app.models.claim import Claim
from app.models.audit_log import AuditLog
from app.models.team_invite import TeamInvite
from app.models.job_request import JobRequest
from sqlalchemy import func


def seed_database():
    print("🚀 Initializing CargoSync database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("\n1. Seeding Administrator Accounts...")
        admins_data = [
            {"name": "CargoSync Admin", "email": "admin@cargosync.com", "password": "Admin123!", "role": "super_admin"},
            {"name": "Dharvesh Ahamed", "email": "dharvesh@gmail.com", "password": "dharvesh123", "role": "super_admin"},
            {"name": "Farhad", "email": "farhad@gmail.com", "password": "farhad123", "role": "super_admin"},
        ]
        for a_info in admins_data:
            existing = db.query(Admin).filter(func.lower(Admin.email) == a_info["email"].lower()).first()
            if not existing:
                admin = Admin(
                    id=str(uuid.uuid4()),
                    name=a_info["name"],
                    email=a_info["email"].lower(),
                    password_hash=hash_password(a_info["password"]),
                    role=a_info["role"],
                )
                db.add(admin)
                print(f"   ✓ Created admin: {a_info['email']}")
            else:
                existing.password_hash = hash_password(a_info["password"])
                print(f"   ℹ Updated admin: {a_info['email']}")
        db.commit()

        print("\n2. Seeding Shipper Company & User...")
        shipper_email = "shipper@cargosync.com"
        company = db.query(Company).filter(func.lower(Company.email) == shipper_email).first()
        if not company:
            company = Company(
                id=str(uuid.uuid4()),
                name="Apex Global Logistics",
                email=shipper_email,
                phone="+1 (555) 234-5678",
                address="742 Evergreen Terrace, Springfield, IL",
                account_type="company",
            )
            db.add(company)
            db.commit()
            db.refresh(company)
            print(f"   ✓ Created shipper company: {company.name}")

        shipper_user = db.query(User).filter(func.lower(User.email) == shipper_email).first()
        if not shipper_user:
            shipper_user = User(
                id=str(uuid.uuid4()),
                company_id=company.id,
                name="Sarah Jenkins",
                email=shipper_email,
                password_hash=hash_password("Shipper123!"),
                phone="+1 (555) 234-5678",
                location="Springfield Distribution Center",
                role="manager",
            )
            db.add(shipper_user)
            db.commit()
            print("   ✓ Created shipper user: shipper@cargosync.com (Password: Shipper123!)")

        # Also support demo company abc@gmail.com
        demo_comp_user = db.query(User).filter(func.lower(User.email) == "abc@gmail.com").first()
        if not demo_comp_user:
            demo_company = Company(
                id=str(uuid.uuid4()),
                name="Everest Paints",
                email="everestpaintsindia@gmail.com",
                phone="+91 98765 43210",
                address="Industrial Area, Phase 2, Mumbai",
                account_type="company",
            )
            db.add(demo_company)
            db.commit()
            db.refresh(demo_company)

            demo_comp_user = User(
                id=str(uuid.uuid4()),
                company_id=demo_company.id,
                name="Commercial Shipper",
                email="abc@gmail.com",
                password_hash=hash_password("Password123!"),
                role="manager",
            )
            db.add(demo_comp_user)
            db.commit()
            print("   ✓ Created demo company user: abc@gmail.com (Password: Password123!)")

        print("\n3. Seeding Fleet Carrier & Vehicles...")
        carrier_email = "carrier@cargosync.com"
        trucker_company = db.query(Company).filter(func.lower(Company.email) == carrier_email).first()
        if not trucker_company:
            trucker_company = Company(
                id=str(uuid.uuid4()),
                name="Swift Freight Transport",
                email=carrier_email,
                phone="+1 (555) 876-5432",
                address="100 Logistics Blvd, Chicago, IL",
                account_type="trucker",
            )
            db.add(trucker_company)
            db.commit()
            db.refresh(trucker_company)
            print(f"   ✓ Created carrier company: {trucker_company.name}")

        carrier_user = db.query(User).filter(func.lower(User.email) == carrier_email).first()
        if not carrier_user:
            carrier_user = User(
                id=str(uuid.uuid4()),
                company_id=trucker_company.id,
                name="Marcus Vance",
                email=carrier_email,
                password_hash=hash_password("Carrier123!"),
                phone="+1 (555) 876-5432",
                location="Chicago Terminal",
                role="manager",
            )
            db.add(carrier_user)
            db.commit()
            print("   ✓ Created carrier user: carrier@cargosync.com (Password: Carrier123!)")

        # Driver
        driver = db.query(Driver).filter(Driver.company_id == trucker_company.id).first()
        if not driver:
            driver = Driver(
                id=str(uuid.uuid4()),
                company_id=trucker_company.id,
                name="Rajesh Kumar",
                phone="+91 91234 56789",
                email="rajesh.kumar@swiftfreight.com",
                license_number="DL-MH-2024-004921",
                is_active=True,
            )
            db.add(driver)
            db.commit()
            db.refresh(driver)
            print(f"   ✓ Created driver: {driver.name}")

        # Trucks
        truck = db.query(Truck).filter(Truck.company_id == trucker_company.id).first()
        if not truck:
            truck = Truck(
                id=str(uuid.uuid4()),
                company_id=trucker_company.id,
                truck_name="Volvo FH16 Standard Container",
                plate_number="MH-04-AZ-8891",
                length_cm=1360.0,
                width_cm=245.0,
                height_cm=270.0,
                max_weight_kg=24000.0,
                driver_id=driver.id,
                driver_name=driver.name,
                is_active=True,
            )
            db.add(truck)
            db.commit()
            db.refresh(truck)
            print(f"   ✓ Created truck: {truck.truck_name} ({truck.plate_number})")

        print("\n4. Seeding Sample Freight Shipment & Cargo...")
        sample_job = db.query(Job).filter(Job.job_name == "Industrial Motors & Spare Parts").first()
        if not sample_job:
            from datetime import date
            sample_job = Job(
                id=str(uuid.uuid4()),
                company_id=company.id,
                job_name="Industrial Motors & Spare Parts",
                date=date.today(),
                time_window="09:00 - 18:00",
                description="Palletized precision electric motors and heavy machine components.",
                pickup_location="Mumbai Port CFS, Terminal 2",
                delivery_location="Gurugram Logistics Park, Gate 4",
                status="posted",
            )
            db.add(sample_job)
            db.commit()
            db.refresh(sample_job)

            # Sample Cargo Boxes
            sample_boxes = [
                {"name": "Electric Motor Unit #1", "length": 120.0, "width": 80.0, "height": 90.0, "weight": 220.0, "hazard": False},
                {"name": "Electric Motor Unit #2", "length": 120.0, "width": 80.0, "height": 90.0, "weight": 220.0, "hazard": False},
                {"name": "Gearbox Spares Pallet", "length": 100.0, "width": 100.0, "height": 85.0, "weight": 180.0, "hazard": False},
                {"name": "Hydraulic Couplings Box", "length": 80.0, "width": 60.0, "height": 50.0, "weight": 65.0, "hazard": False},
                {"name": "Bearing Assembly Kit", "length": 60.0, "width": 40.0, "height": 40.0, "weight": 40.0, "hazard": False},
            ]
            for b in sample_boxes:
                box_entry = Box(
                    id=str(uuid.uuid4()),
                    job_id=sample_job.id,
                    label_reference=b["name"],
                    length_cm=b["length"],
                    width_cm=b["width"],
                    height_cm=b["height"],
                    weight_kg=b["weight"],
                    stop_order=1,
                    fragile=False,
                    hazard=b["hazard"],
                )
                db.add(box_entry)
            db.commit()
            print(f"   ✓ Created freight job: {sample_job.job_name} with 5 cargo boxes")

        print("\n" + "="*60)
        print("✅ Seeding complete! Demo credentials available:")
        print("   Super Admin:  admin@cargosync.com    | Admin123!")
        print("   Shipper:      shipper@cargosync.com  | Shipper123!")
        print("   Carrier:      carrier@cargosync.com  | Carrier123!")
        print("   Demo Company: abc@gmail.com          | Password123!")
        print("="*60)

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
