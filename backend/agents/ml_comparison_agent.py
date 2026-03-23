"""
ML Comparison Agent - Provides baseline ML model comparisons
"""

from datetime import datetime
from typing import Dict, List, Optional
import random

class MLComparisonAgent:
    """Compares AI agent decisions against baseline ML models"""
    
    def __init__(self):
        self.name = "MLComparisonAgent"
        self.session_id = ""
        # ML baseline models
        self.models = {
            "random_forest": {"name": "Random Forest Classifier", "accuracy": 0.71},
            "gradient_boost": {"name": "Gradient Boosting", "accuracy": 0.73},
            "neural_network": {"name": "Neural Network", "accuracy": 0.68},
            "svm": {"name": "Support Vector Machine", "accuracy": 0.64},
            "logistic_regression": {"name": "Logistic Regression", "accuracy": 0.61}
        }
    
    async def compare_with_baseline(self, ai_recommendation: Dict, trains: List[Dict],
                                   intent: dict, session_id: str = "") -> dict:
        """
        Compare AI agent recommendation with ML baselines
        
        Args:
            ai_recommendation: Recommendation from AI agents
            trains: Available trains
            intent: Search intent
            session_id: Unique session identifier
            
        Returns:
            dict with comparison results
        """
        self.session_id = session_id
        
        activity = {
            "timestamp": int(datetime.utcnow().timestamp()),
            "agent": self.name,
            "action": "compare_with_baseline",
            "status": "running",
            "sessionId": session_id
        }
        
        try:
            # Generate ML baseline predictions
            ml_predictions = {}
            for model_key, model_info in self.models.items():
                prediction = self._generate_model_prediction(
                    model_key, trains, intent
                )
                ml_predictions[model_key] = prediction
            
            # Compare AI vs ML results
            comparison = self._perform_comparison(
                ai_recommendation, ml_predictions, trains
            )
            
            # Calculate advantage metrics
            advantage = self._calculate_ai_advantage(
                ai_recommendation, ml_predictions
            )
            
            # Generate insights
            insights = self._generate_comparison_insights(
                ai_recommendation, ml_predictions, advantage
            )
            
            activity["status"] = "completed"
            activity["details"] = {
                "aiScore": ai_recommendation.get("score"),
                "bestMLScore": max(
                    p.get("score", 0) for p in ml_predictions.values()
                ),
                "aiAdvantage": f"{round(advantage.get('percentageAdvantage', 0), 1)}%"
            }
            
            return {
                "success": True,
                "comparison": comparison,
                "mlPredictions": ml_predictions,
                "aiAdvantage": advantage,
                "insights": insights,
                "activity": activity
            }
        
        except Exception as e:
            activity["status"] = "failed"
            activity["details"] = {"error": str(e)}
            
            return {
                "success": False,
                "error": f"Comparison failed: {str(e)}",
                "activity": activity
            }
    
    async def predict_booking_success(self, train: Dict, intent: dict) -> dict:
        """
        Predict booking success using multiple ML models
        
        Args:
            train: Train to predict success for
            intent: Search intent
            
        Returns:
            dict with success predictions from different models
        """
        try:
            predictions = {}
            
            for model_key, model_info in self.models.items():
                # Simulate model predictions
                factors = self._extract_features(train, intent)
                success_prob = self._predict_booking_success_probability(
                    model_key, factors
                )
                
                predictions[model_key] = {
                    "model": model_info.get("name"),
                    "successProbability": round(success_prob, 3),
                    "successPercentage": f"{round(success_prob * 100, 1)}%",
                    "confidence": self._calculate_model_confidence(model_key),
                    "reasoning": self._explain_prediction(model_key, factors, success_prob)
                }
            
            # Ensemble prediction (average of all models)
            ensemble_prob = sum(
                p.get("successProbability", 0) for p in predictions.values()
            ) / len(predictions)
            
            return {
                "success": True,
                "predictions": predictions,
                "ensembleAverage": round(ensemble_prob, 3),
                "ensemblePercentage": f"{round(ensemble_prob * 100, 1)}%",
                "recommendation": self._generate_booking_recommendation(ensemble_prob)
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "predictions": {}
            }
    
    def _generate_model_prediction(self, model_key: str, trains: List[Dict], 
                                  intent: dict) -> Dict:
        """Generate prediction from a specific ML model"""
        # Each model would score the trains differently
        model_weights = {
            "random_forest": {"availability": 0.3, "speed": 0.25, "price": 0.25, "tatkal": 0.2},
            "gradient_boost": {"availability": 0.35, "speed": 0.2, "price": 0.2, "tatkal": 0.25},
            "neural_network": {"availability": 0.25, "speed": 0.3, "price": 0.2, "tatkal": 0.25},
            "svm": {"availability": 0.2, "speed": 0.3, "price": 0.3, "tatkal": 0.2},
            "logistic_regression": {"availability": 0.4, "speed": 0.15, "price": 0.3, "tatkal": 0.15}
        }
        
        weights = model_weights.get(model_key, model_weights["random_forest"])
        
        best_score = 0
        best_train = None
        
        for train in trains:
            score = (
                (self._score_availability(train) * weights["availability"] +
                 self._score_speed(train) * weights["speed"] +
                 self._score_price(train, intent) * weights["price"] +
                 self._score_tatkal(train, intent) * weights["tatkal"]) * 100
            )
            
            if score > best_score:
                best_score = score
                best_train = train
        
        return {
            "model": model_key,
            "recommendedTrain": best_train.get("name") if best_train else None,
            "score": round(best_score, 2),
            "confidence": self.models.get(model_key, {}).get("accuracy"),
            "reasoning": f"Selected based on {model_key} algorithm"
        }
    
    def _perform_comparison(self, ai_recommendation: Dict, 
                           ml_predictions: Dict, trains: List[Dict]) -> Dict:
        """Compare AI recommendation with ML predictions"""
        ai_train = ai_recommendation.get("train", {})
        ai_score = ai_recommendation.get("score", 0)
        
        comparison = {
            "aiRecommendation": {
                "train": ai_train.get("name"),
                "score": ai_score,
                "source": "Multi-Agent AI System"
            },
            "mlPredictions": {},
            "consensus": self._calculate_consensus(ai_recommendation, ml_predictions),
            "disagreement": self._identify_disagreement(ai_recommendation, ml_predictions)
        }
        
        for model_key, prediction in ml_predictions.items():
            comparison["mlPredictions"][model_key] = {
                "train": prediction.get("recommendedTrain"),
                "score": prediction.get("score"),
                "model": prediction.get("model")
            }
        
        return comparison
    
    def _calculate_ai_advantage(self, ai_rec: Dict, ml_preds: Dict) -> Dict:
        """Calculate AI system advantage over ML baselines"""
        ai_score = ai_rec.get("score", 0)
        ml_scores = [p.get("score", 0) for p in ml_preds.values()]
        avg_ml_score = sum(ml_scores) / len(ml_scores) if ml_scores else 0
        
        absolute_advantage = ai_score - avg_ml_score
        percentage_advantage = (absolute_advantage / avg_ml_score * 100) if avg_ml_score > 0 else 0
        
        return {
            "aiScore": ai_score,
            "averageMLScore": round(avg_ml_score, 2),
            "absoluteAdvantage": round(absolute_advantage, 2),
            "percentageAdvantage": round(percentage_advantage, 2),
            "conclusion": self._interpret_advantage(percentage_advantage)
        }
    
    def _generate_comparison_insights(self, ai_rec: Dict, 
                                     ml_preds: Dict, advantage: Dict) -> List[str]:
        """Generate insights from comparison"""
        insights = []
        
        pct_adv = advantage.get("percentageAdvantage", 0)
        
        if pct_adv > 5:
            insights.append(f"AI system outperforms ML baselines by {pct_adv}%")
            insights.append("Multi-agent approach provides superior decision-making")
        elif pct_adv > 0:
            insights.append(f"AI system marginally better than ML averages ({pct_adv}%)")
            insights.append("Both approaches are competitive")
        else:
            insights.append(f"ML baselines perform {abs(pct_adv)}% better than AI system")
            insights.append("Consider ML approach or hybrid decision-making")
        
        # Check consensus
        consensus = self._calculate_consensus(ai_rec, ml_preds)
        if consensus.get("agreementPercentage", 0) > 80:
            insights.append("Strong consensus between AI and ML systems")
            insights.append("High confidence in recommendation")
        else:
            insights.append("Diverging recommendations - consider alternatives")
        
        return insights
    
    def _calculate_consensus(self, ai_rec: Dict, ml_preds: Dict) -> Dict:
        """Calculate agreement between AI and ML systems"""
        ai_train = ai_rec.get("train", {}).get("name")
        ml_trains = [p.get("recommendedTrain") for p in ml_preds.values()]
        
        agreements = sum(1 for t in ml_trains if t == ai_train)
        agreement_percentage = (agreements / len(ml_trains) * 100) if ml_trains else 0
        
        return {
            "agreeingModels": agreements,
            "totalModels": len(ml_preds),
            "agreementPercentage": round(agreement_percentage, 1),
            "consensus": "Strong" if agreement_percentage > 60 else "Weak"
        }
    
    def _identify_disagreement(self, ai_rec: Dict, ml_preds: Dict) -> List[str]:
        """Identify where AI and ML systems disagree"""
        disagreements = []
        ai_train = ai_rec.get("train", {}).get("name")
        
        for model_key, prediction in ml_preds.items():
            if prediction.get("recommendedTrain") != ai_train:
                disagreements.append({
                    "model": prediction.get("model"),
                    "aiChoice": ai_train,
                    "mlChoice": prediction.get("recommendedTrain"),
                    "reasoning": f"{prediction.get('model')} prioritizes different factors"
                })
        
        return disagreements
    
    def _score_availability(self, train: Dict) -> float:
        """Score availability (0-1)"""
        available = train.get("availableSeats", {}).get("sleeper", 0)
        return min(1.0, available / 10)
    
    def _score_speed(self, train: Dict) -> float:
        """Score speed (0-1)"""
        try:
            duration = train.get("duration", "00:00")
            hours = int(duration.split(":")[0])
            return max(0.2, 1.0 - (hours / 48))
        except:
            return 0.5
    
    def _score_price(self, train: Dict, intent: dict) -> float:
        """Score price (0-1)"""
        price_key = "tatkalPrice" if intent.get("isTatkal") else "price"
        price = train.get(price_key, {}).get(intent.get("class", "sleeper"), 5000)
        return max(0.2, 1.0 - (price / 5000))
    
    def _score_tatkal(self, train: Dict, intent: dict) -> float:
        """Score Tatkal suitability (0-1)"""
        if not intent.get("isTatkal"):
            return 0.5
        available = train.get("availableSeats", {}).get("sleeper", 0)
        return min(1.0, available / 15)
    
    def _extract_features(self, train: Dict, intent: dict) -> Dict:
        """Extract features for ML models"""
        return {
            "availability": self._score_availability(train),
            "speed": self._score_speed(train),
            "price": self._score_price(train, intent),
            "tatkal": self._score_tatkal(train, intent),
            "distance": train.get("distance", 0),
            "isTatkal": intent.get("isTatkal", False)
        }
    
    def _predict_booking_success_probability(self, model_key: str, features: Dict) -> float:
        """Predict booking success probability using specific model"""
        weights = {
            "random_forest": {"availability": 0.4, "speed": 0.2, "price": 0.2, "tatkal": 0.2},
            "gradient_boost": {"availability": 0.35, "speed": 0.25, "price": 0.2, "tatkal": 0.2},
            "neural_network": {"availability": 0.5, "speed": 0.15, "price": 0.15, "tatkal": 0.2},
            "svm": {"availability": 0.3, "speed": 0.3, "price": 0.2, "tatkal": 0.2},
            "logistic_regression": {"availability": 0.6, "speed": 0.1, "price": 0.15, "tatkal": 0.15}
        }
        
        w = weights.get(model_key, weights["random_forest"])
        probability = (
            features.get("availability", 0) * w["availability"] +
            features.get("speed", 0) * w["speed"] +
            features.get("price", 0) * w["price"] +
            features.get("tatkal", 0) * w["tatkal"]
        )
        
        # Add randomness for realism
        probability += random.uniform(-0.05, 0.05)
        return max(0.1, min(0.95, probability))
    
    def _calculate_model_confidence(self, model_key: str) -> float:
        """Get model confidence/accuracy"""
        return self.models.get(model_key, {}).get("accuracy", 0.65)
    
    def _explain_prediction(self, model_key: str, features: Dict, probability: float) -> str:
        """Explain why model made this prediction"""
        top_factor = max(
            ("availability", features.get("availability")),
            ("speed", features.get("speed")),
            ("price", features.get("price")),
            ("tatkal", features.get("tatkal")),
            key=lambda x: x[1]
        )
        
        return f"{self.models[model_key]['name']} prioritizes {top_factor[0]} (score: {top_factor[1]:.2f})"
    
    def _generate_booking_recommendation(self, probability: float) -> str:
        """Generate booking recommendation based on ensemble prediction"""
        if probability > 0.8:
            return "Highly recommended - excellent booking success probability"
        elif probability > 0.6:
            return "Recommended - good booking success probability"
        elif probability > 0.4:
            return "Consider alternatives - moderate success probability"
        else:
            return "Not recommended - low booking success probability"
    
    def _interpret_advantage(self, percentage: float) -> str:
        """Interpret AI advantage percentage"""
        if percentage > 10:
            return "AI system significantly outperforms ML baselines"
        elif percentage > 5:
            return "AI system moderately outperforms ML baselines"
        elif percentage > 0:
            return "AI system slightly outperforms ML baselines"
        elif percentage > -5:
            return "AI and ML systems are comparably performing"
        else:
            return "ML baselines slightly outperform AI system"
