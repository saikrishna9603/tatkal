"""
Generate 1000 realistic Indian trains data (ISRTC format)
Covers all Indian states with realistic train names, routes, and schedules
"""

import json
import random
from datetime import time, timedelta

# Indian states and major cities
STATES_CITIES = {
    "Andhra Pradesh": ["Hyderabad", "Vijayawada", "Visakhapatnam"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun"],
    "Assam": ["Guwahati", "Silchar", "Dibrughar"],
    "Bihar": ["Patna", "Gaya", "Darbhanga"],
    "Chhattisgarh": ["Raipur", "Bilaspur", "Durg"],
    "Goa": ["Vasco da Gama", "Margao"],
    "Gujarat": ["Ahmedabad", "Vadodara", "Surat", "Rajkot"],
    "Haryana": ["Faridabad", "Gurugram"],
    "Himachal Pradesh": ["Shimla", "Mandi"],
    "Jharkhand": ["Ranchi", "Dhanbad", "Jamshedpur"],
    "Karnataka": ["Bangalore", "Mangalore", "Mysore", "Belgaum"],
    "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Aurangabad"],
    "Manipur": ["Imphal"],
    "Meghalaya": ["Shillong"],
    "Mizoram": ["Aizawl"],
    "Nagaland": ["Kohima", "Dimapur"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
    "Punjab": ["Amritsar", "Ludhiana", "Chandigarh"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
    "Sikkim": ["Gangtok"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
    "Telangana": ["Hyderabad", "Warangal"],
    "Tripura": ["Agartala"],
    "Uttar Pradesh": ["Delhi", "Lucknow", "Kanpur", "Varanasi", "Agra"],
    "Uttarakhand": ["Dehradun", "Haridwar"],
    "West Bengal": ["Kolkata", "Darjeeling", "Siliguri"],
}

# Train prefixes (realistic Indian railway designations)
TRAIN_PREFIXES = [
    "Rajdhani", "Shatabdi", "Express", "Fast", "Mail", "Special",
    "Premium", "Deluxe", "Super", "Intercity", "Local", "Passenger"
]

# Train classes
CLASSES = ["Sleeper", "AC1", "AC2", "AC3", "General"]
CLASS_PRICES = {
    "Sleeper": 400,
    "AC3": 650,
    "AC2": 890,
    "AC1": 1200,
    "General": 200
}

def generate_train_number():
    """Generate realistic Indian train number (4-5 digits)"""
    return str(random.randint(10000, 99999))

def generate_train_name():
    """Generate realistic train name"""
    prefix = random.choice(TRAIN_PREFIXES)
    city_names = random.sample(list(STATES_CITIES.values()), 1)[0]
    return f"{prefix} Express" if random.random() > 0.3 else f"{prefix}"

def generate_departure_time():
    """Generate random departure time"""
    hour = random.randint(0, 23)
    minute = random.choice([0, 15, 30, 45])
    return f"{hour:02d}:{minute:02d}"

def generate_arrival_time(departure_str):
    """Generate arrival time based on departure"""
    dep_hour, dep_min = map(int, departure_str.split(":"))
    dep_minutes = dep_hour * 60 + dep_min
    
    # Journey duration: 4-48 hours
    duration = random.randint(240, 2880)  # minutes
    arr_minutes = (dep_minutes + duration) % (24 * 60)
    
    arr_hour = arr_minutes // 60
    arr_min = arr_minutes % 60
    
    return f"{arr_hour:02d}:{arr_min:02d}", duration

def generate_duration_str(minutes):
    """Format duration to HH:MM string"""
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours}h {mins}m"

def generate_stops():
    """Generate number of stops"""
    return random.randint(2, 8)

def generate_availability():
    """Generate seat availability"""
    return {
        "Sleeper": random.randint(20, 200),
        "AC3": random.randint(15, 150),
        "AC2": random.randint(10, 100),
        "AC1": random.randint(5, 50),
        "General": random.randint(50, 300)
    }

def generate_trains(count=1000):
    """Generate 1000 trains across all Indian states"""
    trains = []
    cities_list = []
    
    # Flatten cities list
    for cities in STATES_CITIES.values():
        cities_list.extend(cities)
    
    for i in range(count):
        from_city, to_city = random.sample(cities_list, 2)
        
        dep_time = generate_departure_time()
        arr_time, duration = generate_arrival_time(dep_time)
        
        train = {
            "id": i + 1,
            "number": generate_train_number(),
            "name": generate_train_name(),
            "from": from_city,
            "to": to_city,
            "departureTime": dep_time,
            "arrivalTime": arr_time,
            "duration": generate_duration_str(duration),
            "durationMinutes": duration,
            "stops": generate_stops(),
            "classes": CLASSES,
            "prices": {
                cls: CLASS_PRICES[cls] + random.randint(-50, 100)
                for cls in CLASSES
            },
            "availability": generate_availability(),
            "operatingDays": random.randint(1, 7),  # Days in week
            "quota": random.choice(["GENERAL", "TATKAL", "PREMIUM"]),
            "frequency": random.choice(["Daily", "Alternate", "Weekly", "BiWeekly"]),
            "amenities": random.sample([
                "WiFi",
                "Pantry",
                "Charging Points",
                "AC",
                "Bedding",
                "Meals",
                "Entertainment",
                "Medical Officer"
            ], random.randint(3, 6)),
            "ratings": {
                "overallRating": round(random.uniform(3.5, 5.0), 1),
                "reviews": random.randint(50, 500),
                "comfort": round(random.uniform(3.0, 5.0), 1),
                "cleanliness": round(random.uniform(3.0, 5.0), 1),
                "punctuality": round(random.uniform(3.0, 5.0), 1)
            },
            "tattkalEligible": random.choice([True, False]),
            "tattkalPrice": round(CLASS_PRICES["AC3"] * 1.5) if random.choice([True, False]) else None,
            "cancellationPolicy": random.choice([
                "30% Refund",
                "50% Refund",
                "75% Refund",
                "Full Refund"
            ]),
            "platform": random.randint(1, 15),
            "station": f"{from_city} Station",
            "destinationStation": f"{to_city} Station"
        }
        
        trains.append(train)
    
    return trains

def main():
    print("🚂 Generating 1000 Indian trains data...")
    trains = generate_trains(1000)
    
    # Save to JSON file
    with open("c:\\Users\\Admin\\Downloads\\OURMINIPROJECT\\MOCK_DATA.json", "w") as f:
        json.dump(trains, f, indent=2)
    
    print(f"✅ Generated {len(trains)} trains")
    print(f"✅ Saved to MOCK_DATA.json")
    
    # Print sample trains
    print("\n📊 Sample Trains:")
    for i in range(5):
        train = trains[i]
        print(f"\n{i+1}. {train['name']} (#{train['number']})")
        print(f"   {train['from']} → {train['to']}")
        print(f"   {train['departureTime']} - {train['arrivalTime']} ({train['duration']})")
        print(f"   Price: ₹{train['prices']['AC3']} (AC3)")
        print(f"   Rating: ⭐ {train['ratings']['overallRating']}/5.0")

if __name__ == "__main__":
    main()
