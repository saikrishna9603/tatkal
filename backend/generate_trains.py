"""
Generate 1000 realistic ISRTC trains across all Indian states
"""

import random
import json
from datetime import datetime, timedelta

# Indian states and major cities
ROUTES = {
    'Delhi': ['Jaipur', 'Agra', 'Lucknow', 'Chandigarh', 'Haridwar', 'Meerut', 'Ghaziabad'],
    'Mumbai': ['Pune', 'Nagpur', 'Aurangabad', 'Nashik', 'Thane', 'Kolhapur', 'Satara'],
    'Bangalore': ['Mysore', 'Chennai', 'Hyderabad', 'Kochi', 'Coimbatore', 'Mangalore', 'Belgaum'],
    'Kolkata': ['Patna', 'Gaya', 'Asansol', 'Dhanbad', 'Siliguri', 'Darjeeling', 'Varanasi'],
    'Chennai': ['Bangalore', 'Hyderabad', 'Coimbatore', 'Madurai', 'Kanyakumari', 'Pondicherry', 'Tirupati'],
    'Hyderabad': ['Bangalore', 'Vijayawada', 'Visakhapatnam', 'Secunderabad', 'Warangal', 'Karimnagar'],
    'Ahmedabad': ['Vadodara', 'Surat', 'Rajkot', 'Jamnagar', 'Bhavnagar', 'Gandhinagar'],
    'Pune': ['Mumbai', 'Aurangabad', 'Nashik', 'Solapur', 'Satara', 'Kolhapur'],
    'Jaipur': ['Delhi', 'Agra', 'Udaipur', 'Jodhpur', 'Bikaner', 'Kota', 'Ajmer'],
    'Lucknow': ['Delhi', 'Kanpur', 'Varanasi', 'Allahabad', 'Gorakhpur', 'Sultanpur'],
    'Guwahati': ['Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur', 'Arpa'],
    'Chandigarh': ['Delhi', 'Ambala', 'Mohali', 'Himachal Pradesh'],
    'Bhopal': ['Indore', 'Gwalior', 'Jabalpur', 'Raipur', 'Ujjain'],
    'Vadodara': ['Ahmedabad', 'Mumbai', 'Surat', 'Anand'],
    'Surat': ['Vadodara', 'Ahmedabad', 'Mumbai', 'Vapi'],
    'Kochi': ['Bangalore', 'Thiruvananthapuram', 'Ernakulam', 'Kannur'],
    'Thiruvananthapuram': ['Kochi', 'Kottayam', 'Pathanamthitta'],
    'Varanasi': ['Delhi', 'Lucknow', 'Kolkata', 'Patna', 'Agra'],
    'Patna': ['Kolkata', 'Delhi', 'Lucknow', 'Varanasi', 'Gaya'],
    'Indore': ['Bhopal', 'Mumbai', 'Vadodara', 'Ujjain'],
}

TRAIN_TYPES = [
    'Rajdhani', 'Shatabdi', 'Express', 'SuperFast', 'Local', 
    'Passenger', 'Mail', 'Intercity', 'Double Decker', 'Premium'
]

CLASSES = ['AC1', 'AC2', 'AC3', 'Sleeper', 'First', 'General']

QUOTAS = ['GENERAL', 'TATKAL', 'PREMIUM', 'SENIOR_CITIZEN', 'LADIES']

def generate_trains(count=1000):
    """Generate mock train data"""
    trains = []
    train_id = 1
    
    routes_list = list(ROUTES.items())
    
    for i in range(count):
        from_city, to_cities = random.choice(routes_list)
        to_city = random.choice(to_cities)
        
        # Avoid same from and to
        while to_city == from_city:
            to_city = random.choice(to_cities)
        
        # Calculate distance (mock)
        distance = random.randint(100, 3000)
        
        # Departure time
        hour = random.randint(0, 23)
        minute = random.choice([0, 15, 30, 45])
        departure_time = f"{hour:02d}:{minute:02d}"
        
        # Duration in hours
        duration_hours = max(1, distance // 60)
        arrival_hour = (hour + duration_hours) % 24
        arrival_time = f"{arrival_hour:02d}:{minute:02d}"
        
        # Pricing
        base_price = 500 + (distance // 10)
        
        train = {
            "id": f"TR{train_id:04d}",
            "number": f"{10000 + train_id}",
            "name": f"{random.choice(TRAIN_TYPES)} {train_id}",
            "from": from_city,
            "to": to_city,
            "departureTime": departure_time,
            "arrivalTime": arrival_time,
            "duration": f"{duration_hours}h {random.randint(0, 59)}m",
            "distance": distance,
            "type": random.choice(TRAIN_TYPES),
            "totalSeats": random.randint(100, 800),
            "availableSeats": random.randint(0, 100),
            "price": {
                "AC1": base_price + 2000,
                "AC2": base_price + 1500,
                "AC3": base_price + 1000,
                "Sleeper": base_price + 500,
                "First": base_price + 2500,
                "General": base_price
            },
            "berthAvailability": {
                "LOWER": random.randint(0, 50),
                "MIDDLE": random.randint(0, 50),
                "UPPER": random.randint(0, 50),
                "SIDE": random.randint(0, 30)
            },
            "operatingDays": [1, 2, 3, 4, 5, 6, 7],  # All days
            "quota": random.choice(QUOTAS),
            "rating": round(random.uniform(3.5, 4.9), 1),
            "reviews": random.randint(50, 5000),
            "amenities": [
                "WiFi",
                "Pantry",
                "Bedroll",
                "Charging Points",
                "Onboard Catering",
                "First Aid",
                "Safety",
                "Entertainment"
            ][:random.randint(3, 8)],
            "tatkalAvailable": random.choice([True, False]),
            "tatkalPrice": {
                "AC1": base_price + 2500,
                "AC2": base_price + 2000,
                "AC3": base_price + 1500,
                "Sleeper": base_price + 1000,
                "First": base_price + 3000,
                "General": base_price + 500
            } if random.choice([True, False]) else None,
            "cancelationPolicy": {
                "hoursBeforeDeparture": 24,
                "refundPercentage": 100
            },
            "platform": f"{random.randint(1, 20)}",
            "lastUpdated": datetime.now().isoformat()
        }
        
        trains.append(train)
        train_id += 1
    
    return trains

def save_trains_to_json(trains, filename="trains_data.json"):
    """Save trains to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(trains, f, indent=2, ensure_ascii=False)
    print(f"✅ Generated and saved {len(trains)} trains to {filename}")

def save_trains_to_python(trains, filename="trains_mock_data.py"):
    """Save trains as Python constant"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("# Auto-generated train mock data\n")
        f.write("# 1000 ISRTC trains across Indian states\n\n")
        f.write("TRAINS_DATA = [\n")
        for i, train in enumerate(trains):
            f.write(f"    {train},\n")
            if (i + 1) % 100 == 0:
                print(f"  Generated {i + 1} trains...")
        f.write("]\n")
    print(f"✅ Generated and saved {len(trains)} trains to {filename}")

if __name__ == "__main__":
    print("🚂 Generating 1000 ISRTC trains...")
    trains = generate_trains(1000)
    
    # Save as JSON
    save_trains_to_json(trains, "backend/trains_data.json")
    
    print("\n✅ Train data generation complete!")
    print(f"📊 Total trains: {len(trains)}")
    print("\nSample train:")
    import pprint
    pprint.pprint(trains[0])
