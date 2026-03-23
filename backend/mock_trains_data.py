"""
1000 Indian Railways Train Mock Data
Covering all states following ISRTC standards
"""

import json
from datetime import datetime, timedelta
import random

# Indian states and major cities
STATES_CITIES = {
    'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Tirupati'],
    'Arunachal Pradesh': ['Itanagar', 'Pasighat'],
    'Assam': ['Guwahati', 'Dibrugarh', 'Silchar'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
    'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Haryana': ['Faridabad', 'Gurgaon', 'Hisar'],
    'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala'],
    'Jharkhand': ['Ranchi', 'Dhanbad', 'Jamshedpur'],
    'Karnataka': ['Bengaluru', 'Mysore', 'Mangalore', 'Hubballi'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad'],
    'Manipur': ['Imphal'],
    'Meghalaya': ['Shillong'],
    'Mizoram': ['Aizawl'],
    'Nagaland': ['Kohima'],
    'Odisha': ['Bhubaneswar', 'Rourkela', 'Cuttack'],
    'Punjab': ['Amritsar', 'Ludhiana', 'Chandigarh'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Ajmer'],
    'Sikkim': ['Gangtok'],
    'Tamil Nadu': ['Chennai', 'Madurai', 'Coimbatore', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal'],
    'Tripura': ['Agartala'],
    'Uttar Pradesh': ['Delhi', 'Lucknow', 'Agra', 'Varanasi', 'Kanpur'],
    'Uttarakhand': ['Dehradun', 'Rishikesh', 'Haldwani'],
    'West Bengal': ['Kolkata', 'Darjeeling', 'Asansol'],
}

TRAIN_TYPES = [
    'Rajdhani Express', 'Shatabdi Express', 'Duronto Express',
    'Local', 'Express', 'Fast Passenger', 'Mail', 'Intercity',
    'Superfast', 'Jan Shatabdi', 'Premium Express'
]

CLASSES = ['General', 'Sleeper', 'AC3', 'AC2', 'AC1', 'Economy']

QUOTAS = ['GENERAL', 'TATKAL', 'PREMIUM', 'SENIOR_CITIZEN', 'LADIES', 'DEFENCE']

BERTH_TYPES = ['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER']

def generate_train_number():
    """Generate realistic Indian railway train number"""
    return f"{random.randint(10001, 90000)}"

def generate_trains_data(num_trains=1000):
    """Generate 1000 realistic train data"""
    trains = []
    train_numbers = set()
    
    all_cities = []
    for state_cities in STATES_CITIES.values():
        all_cities.extend(state_cities)
    
    for i in range(num_trains):
        # Ensure unique train numbers
        while True:
            train_num = generate_train_number()
            if train_num not in train_numbers:
                train_numbers.add(train_num)
                break
        
        # Random route
        from_city = random.choice(all_cities)
        to_city = random.choice([c for c in all_cities if c != from_city])
        
        # Random times
        dep_hour = random.randint(0, 23)
        dep_minute = random.randint(0, 59)
        duration_hours = random.randint(2, 48)
        duration_minutes = random.randint(0, 59)
        
        arr_hour = (dep_hour + duration_hours) % 24
        arr_minute = (dep_minute + duration_minutes) % 60
        
        dep_time = f"{dep_hour:02d}:{dep_minute:02d}"
        arr_time = f"{arr_hour:02d}:{arr_minute:02d}"
        duration = f"{duration_hours}h {duration_minutes}m"
        
        # Pricing based on class
        base_price = random.randint(300, 5000)
        
        prices = {
            'General': base_price,
            'Sleeper': int(base_price * 1.3),
            'AC3': int(base_price * 1.8),
            'AC2': int(base_price * 2.5),
            'AC1': int(base_price * 3.5),
            'Economy': int(base_price * 0.8)
        }
        
        # Availability
        total_seats = random.randint(50, 500)
        available_seats = random.randint(1, total_seats)
        rac_seats = random.randint(0, 20)
        waitlist = random.randint(0, 50)
        
        train = {
            '_id': f"train_{i+1:04d}",
            'number': train_num,
            'name': f"{random.choice(TRAIN_TYPES)} {train_num}",
            'from': from_city,
            'to': to_city,
            'departureTime': dep_time,
            'arrivalTime': arr_time,
            'duration': duration,
            'classes': random.sample(CLASSES, random.randint(3, 6)),
            'price': prices,
            'availability': {
                'confirmed': available_seats,
                'rac': rac_seats,
                'waitlist': waitlist,
                'total': total_seats
            },
            'quotas': random.sample(QUOTAS, random.randint(3, 5)),
            'amenities': random.sample([
                'Pantry Car', 'WiFi', 'Power Outlet', 'Blankets',
                'Meals', 'Entertainment', 'Reading Light', 'USB Charging'
            ], random.randint(3, 6)),
            'halts': random.randint(5, 15),
            'rating': round(random.uniform(3.5, 4.9), 1),
            'reviews': random.randint(50, 5000),
            'tatkal_eligible': random.choice([True, False]),
            'tatkal_start_time': f"{random.randint(8, 14):02d}:00" if random.choice([True, False]) else None,
            'runsOn': random.sample(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], random.randint(5, 7)),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        trains.append(train)
    
    return trains

def save_trains_to_json(trains, filename='trains_1000.json'):
    """Save trains data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(trains, f, indent=2, ensure_ascii=False)
    print(f"✓ {len(trains)} trains saved to {filename}")
    return trains

def get_sample_trains():
    """Return sample trains for quick testing"""
    return {
        'trains': generate_trains_data(1000),
        'total_count': 1000,
        'generated_at': datetime.now().isoformat(),
        'stations': {state: cities for state, cities in STATES_CITIES.items()},
        'classes': CLASSES,
        'quotas': QUOTAS,
        'train_types': TRAIN_TYPES
    }

if __name__ == "__main__":
    trains = generate_trains_data(1000)
    save_trains_to_json(trains)
    
    # Print sample
    print("\n--- SAMPLE TRAINS ---")
    for train in trains[:5]:
        print(f"\n{train['name']} ({train['number']})")
        print(f"  {train['from']} → {train['to']}")
        print(f"  {train['departureTime']} - {train['arrivalTime']} ({train['duration']})")
        print(f"  Classes: {', '.join(train['classes'])}")
        print(f"  Available: {train['availability']['confirmed']} seats")
