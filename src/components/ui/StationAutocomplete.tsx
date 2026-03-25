// Station Autocomplete Component - Dropdown with fuzzy search
'use client';

import React, { useState, useRef, useEffect } from 'react';

interface StationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const INDIAN_STATIONS = [
  // Metro Cities
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  
  // Major Cities
  'Chandigarh', 'Indore', 'Bhopal', 'Visakhapatnam', 'Kochi',
  'Coimbatore', 'Vadodara', 'Nagpur', 'Surat', 'Agra',
  'Varanasi', 'Rishikesh', 'Udaipur', 'Jodhpur', 'Jaisalmer',
  'Goa', 'Guwahati', 'Patna', 'Ranchi', 'Gurgaon',
  
  // Railway Junction Cities
  'Allahabad', 'Mathura', 'Gwalior', 'Ujjain', 'Aurangabad',
  'Nashik', 'Belgaum', 'Hubballi', 'Mangalore', 'Mysore',
  'Salem', 'Tiruchirappalli', 'Madurai', 'Kozhikode', 'Thiruvananthapuram',
  'Ernakulam', 'Thrissur', 'Palakkad', 'Kannur', 'Kasaragod',
  'Ayodhya', 'Meerut', 'Panipat', 'Rohtak', 'Hisar',
  'Ambala', 'Katihar', 'Muzaffarpur', 'Darbhanga', 'Purnia',
  
  // Second-tier Cities
  'Amritsar', 'Jalandhar', 'Ludhiana', 'Bhatinda', 'Firozpur',
  'Pathankot', 'Hoshiarpur', 'Gurdaspur', 'Kapurthala', 'SBS Nagar',
  'Mandi', 'Shimla', 'Kinnaur', 'Spiti', 'Kaza',
  'Rampur', 'Nahan', 'Solan', 'Kasauli', 'Clement Town',
];

// Fuzzy search implementation
function fuzzySearch(query: string, items: string[]): string[] {
  if (!query.trim()) return items.slice(0, 12);

  const lowerQuery = query.toLowerCase();
  const scored = items
    .filter((item) => item.toLowerCase().includes(lowerQuery))
    .map((item) => {
      const lowerItem = item.toLowerCase();
      const index = lowerItem.indexOf(lowerQuery);
      
      // Exact match at start gets highest score
      let score = 0;
      if (lowerItem === lowerQuery) score = 1000;
      else if (lowerItem.startsWith(lowerQuery)) score = 500 - index;
      else score = 100 - index;

      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((s) => s.item);

  return scored;
}

export default function StationAutocomplete({
  value,
  onChange,
  placeholder = 'Search station...',
  disabled = false,
}: StationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle input change
  useEffect(() => {
    if (value.trim()) {
      const filtered = fuzzySearch(value, INDIAN_STATIONS);
      setSuggestions(filtered);
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setSuggestions(INDIAN_STATIONS.slice(0, 12));
      setIsOpen(false);
    }
  }, [value]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          onChange(suggestions[highlightedIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelectSuggestion = (station: string) => {
    onChange(station);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition disabled:bg-gray-100"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
        {isOpen && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"></circle>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((station, index) => (
            <button
              key={station}
              onClick={() => handleSelectSuggestion(station)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-3 transition ${
                index === highlightedIndex
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 text-gray-800'
              } ${index !== suggestions.length - 1 ? 'border-b border-gray-200' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{station}</span>
                {value.toLowerCase() === station.toLowerCase() && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
              <div className="text-xs opacity-75">Railway Station</div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && suggestions.length === 0 && value.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 p-4 text-center text-gray-600">
          <p>No stations found for "{value}"</p>
          <p className="text-xs mt-1 opacity-75">Try searching by city name</p>
        </div>
      )}

      {/* Popular Stations (when empty) */}
      {isOpen && !value.trim() && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
            Popular Stations
          </div>
          {['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'].map((station) => (
            <button
              key={station}
              onClick={() => handleSelectSuggestion(station)}
              onMouseEnter={() => setHighlightedIndex(suggestions.indexOf(station))}
              className={`w-full text-left px-4 py-2 transition text-sm ${
                suggestions.indexOf(station) === highlightedIndex
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-50 text-gray-800'
              }`}
            >
              🚉 {station}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
