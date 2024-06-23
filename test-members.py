import json
import random
from faker import Faker
from datetime import datetime, timedelta

fake = Faker('en_IN')

def generate_member():
    customer_name = fake.name()
    email = fake.email()
    contact = fake.phone_number()
    age = random.randint(18, 70)
    gender = random.choice(['Male', 'Female'])
    blood_group = random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'])
    today = datetime.today()
    start_date = today - timedelta(days=random.randint(1, 10))  # 2 years = 730 days
    current_begin_date = start_date.strftime('%d %b %Y')
    valid_till = random.randint(1, 5)  # Assuming validTill can be between 1 to 5 years
    charges = random.randint(2000, 5000)  # Assuming charges can vary between 2000 to 5000

    member = {
        "customerName": customer_name,
        "email": email,
        "contact": contact,
        "age": age,
        "gender": gender,
        "bloodGroup": blood_group,
        "currentBeginDate": current_begin_date,
        "validTill": valid_till,
        "charges": charges
    }
    return member

def generate_members(num_members):
    members = []
    for _ in range(num_members):
        member = generate_member()
        members.append(member)
    return members

def save_to_json(members, filename):
    with open(filename, 'w') as f:
        json.dump(members, f, indent=4)

if __name__ == "__main__":
    num_members = 15
    members = generate_members(num_members)
    save_to_json(members, 'members.json')
    print(f"Generated {num_members} members and saved to 'members.json'")
