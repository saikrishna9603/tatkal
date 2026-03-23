"""
Orchestrator - Coordinates all agents in the multi-agent system
"""

from datetime import datetime
from typing import Dict, List, Optional
import uuid

from backend.agents.intent_agent import IntentAgent
from backend.agents.train_search_agent import TrainSearchAgent
from backend.agents.ranking_agent import RankingAgent
from backend.agents.fallback_agent import FallbackAgent
from backend.agents.scheduler_agent import TatkalSchedulerAgent
from backend.agents.booking_execution_agent import BookingExecutionAgent
from backend.agents.explanation_agent import ExplanationAgent
from backend.agents.waitlist_agent import WaitlistProgressionAgent
from backend.agents.pdf_agent import PDFAgent
from backend.agents.ml_comparison_agent import MLComparisonAgent

class Orchestrator:
    """Orchestrates all agents in coordinated workflow"""
    
    def __init__(self):
        self.name = "Orchestrator"
        self.session_id = str(uuid.uuid4())
        
        # Initialize all agents
        self.intent_agent = IntentAgent()
        self.search_agent = TrainSearchAgent()
        self.ranking_agent = RankingAgent()
        self.fallback_agent = FallbackAgent()
        self.scheduler_agent = TatkalSchedulerAgent()
        self.booking_agent = BookingExecutionAgent()
        self.explanation_agent = ExplanationAgent()
        self.waitlist_agent = WaitlistProgressionAgent()
        self.pdf_agent = PDFAgent()
        self.ml_agent = MLComparisonAgent()
        
        # Agent execution log
        self.execution_log = []
    
    async def orchestrate_search(self, search_request: dict, 
                                train_repo=None) -> dict:
        """
        Orchestrate complete search workflow
        
        Args:
            search_request: User search request
            train_repo: TrainRepository instance
            
        Returns:
            dict with complete search results and agent logs
        """
        start_time = datetime.utcnow()
        workflow_id = str(uuid.uuid4())
        
        try:
            results = {
                "workflowId": workflow_id,
                "sessionId": self.session_id,
                "startTime": start_time.isoformat(),
                "stages": {}
            }
            
            # Stage 1: Parse Intent
            intent_result = await self.intent_agent.parse_search_intent(
                search_request, self.session_id
            )
            self.execution_log.append(intent_result.get("activity"))
            results["stages"]["intent"] = intent_result
            
            if not intent_result.get("success"):
                return self._wrap_failure(results, "Intent parsing failed")
            
            intent = intent_result.get("intent")
            
            # Stage 2: Search Trains
            search_result = await self.search_agent.search_trains(
                intent, self.session_id, train_repo
            )
            self.execution_log.append(search_result.get("activity"))
            results["stages"]["search"] = search_result
            
            if not search_result.get("success") or not search_result.get("trains"):
                return self._wrap_failure(results, "No trains found")
            
            trains = search_result.get("trains")
            
            # Stage 3: Rank Trains
            ranking_result = await self.ranking_agent.rank_trains(
                trains, intent, self.session_id
            )
            self.execution_log.append(ranking_result.get("activity"))
            results["stages"]["ranking"] = ranking_result
            
            ranked_trains = ranking_result.get("rankedTrains", [])
            top_train = ranked_trains[0]["train"] if ranked_trains else None
            
            # Stage 4: Check Fallback Options
            fallback_result = await self.fallback_agent.execute_fallback_strategy(
                top_train, trains, intent, self.session_id
            )
            self.execution_log.append(fallback_result.get("activity"))
            results["stages"]["fallback"] = fallback_result
            
            # Stage 5: Tatkal Scheduling (if applicable)
            if intent.get("isTatkal"):
                scheduler_result = await self.scheduler_agent.calculate_tatkal_schedule(
                    intent, self.session_id
                )
                self.execution_log.append(scheduler_result.get("activity"))
                results["stages"]["scheduler"] = scheduler_result
            
            # Stage 6: Explanations
            explanation_result = await self.explanation_agent.explain_ranking(
                ranking_result, intent, self.session_id
            )
            self.execution_log.append(explanation_result.get("activity"))
            results["stages"]["explanation"] = explanation_result
            
            # Stage 7: ML Comparison
            ml_result = await self.ml_agent.compare_with_baseline(
                {
                    "train": top_train,
                    "score": ranked_trains[0]["ranking"]["totalScore"] if ranked_trains else 0
                },
                trains, intent, self.session_id
            )
            self.execution_log.append(ml_result.get("activity"))
            results["stages"]["mlComparison"] = ml_result
            
            # Finalize results
            results["success"] = True
            results["topRecommendation"] = {
                "train": top_train,
                "ranking": ranked_trains[0]["ranking"] if ranked_trains else {}
            }
            results["totalResults"] = search_result.get("totalResults", 0)
            results["rankedResults"] = len(ranked_trains)
            results["agentActivities"] = self.execution_log
            results["endTime"] = datetime.utcnow().isoformat()
            results["executionTime"] = (
                (datetime.utcnow() - start_time).total_seconds()
            )
            
            return results
        
        except Exception as e:
            return self._wrap_failure(results if 'results' in locals() else {}, str(e))
    
    async def orchestrate_booking(self, booking_request: dict,
                                 bookings_repo=None) -> dict:
        """
        Orchestrate complete booking workflow
        
        Args:
            booking_request: Booking request with train, passengers, etc.
            bookings_repo: BookingsRepository instance
            
        Returns:
            dict with booking confirmation and agent logs
        """
        start_time = datetime.utcnow()
        workflow_id = str(uuid.uuid4())
        
        try:
            results = {
                "workflowId": workflow_id,
                "sessionId": self.session_id,
                "startTime": start_time.isoformat(),
                "stages": {}
            }
            
            train = booking_request.get("train")
            passengers = booking_request.get("passengers", [])
            berth_preference = booking_request.get("berthPreference", "NO_PREFERENCE")
            
            # Stage 1: Tatkal Scheduling (if applicable)
            if booking_request.get("isTatkal"):
                scheduler_result = await self.scheduler_agent.calculate_tatkal_schedule(
                    booking_request.get("intent", {}), self.session_id
                )
                self.execution_log.append(scheduler_result.get("activity"))
                results["stages"]["scheduler"] = scheduler_result
            
            # Stage 2: Execute Booking
            booking_result = await self.booking_agent.execute_booking(
                train, passengers, berth_preference, self.session_id, bookings_repo
            )
            self.execution_log.append(booking_result.get("activity"))
            results["stages"]["booking"] = booking_result
            
            if not booking_result.get("success"):
                return self._wrap_failure(results, "Booking execution failed")
            
            pnr = booking_result.get("pnrNumber")
            booking_data = booking_result.get("bookingData")
            
            # Stage 3: Generate PDF
            pdf_result = await self.pdf_agent.generate_e_ticket(
                booking_data, train, passengers, self.session_id
            )
            self.execution_log.append(pdf_result.get("activity"))
            results["stages"]["pdf"] = pdf_result
            
            # Stage 4: Booking Summary
            summary_result = await self.pdf_agent.generate_booking_summary(
                booking_data, train, passengers
            )
            self.execution_log.append({
                "timestamp": int(datetime.utcnow().timestamp()),
                "agent": "PDFAgent",
                "action": "generate_summary",
                "status": "completed"
            })
            results["stages"]["summary"] = summary_result
            
            # Stage 5: Waitlist Tracking (if necessary)
            if booking_result.get("status") in ["RAC", "WAITLIST"]:
                waitlist_result = await self.waitlist_agent.track_waitlist(
                    pnr, booking_request.get("class", "sleeper"),
                    booking_result.get("waitlistPosition", 0),
                    self.session_id
                )
                self.execution_log.append(waitlist_result.get("activity"))
                results["stages"]["waitlist"] = waitlist_result
            
            # Finalize results
            results["success"] = True
            results["pnr"] = pnr
            results["bookingStatus"] = booking_result.get("status", "CONFIRMED")
            results["agentActivities"] = self.execution_log
            results["endTime"] = datetime.utcnow().isoformat()
            results["executionTime"] = (
                (datetime.utcnow() - start_time).total_seconds()
            )
            
            return results
        
        except Exception as e:
            return self._wrap_failure(results if 'results' in locals() else {}, str(e))
    
    async def orchestrate_waitlist_tracking(self, pnr: str, booking_class: str,
                                           waitlist_position: int) -> dict:
        """
        Orchestrate waitlist tracking and simulation
        
        Args:
            pnr: PNR number
            booking_class: Class of booking
            waitlist_position: Current waitlist position
            
        Returns:
            dict with waitlist tracking and progression
        """
        try:
            # Track current status
            tracking_result = await self.waitlist_agent.track_waitlist(
                pnr, booking_class, waitlist_position, self.session_id
            )
            self.execution_log.append(tracking_result.get("activity"))
            
            # Simulate progression
            progression_result = await self.waitlist_agent.simulate_waitlist_progression(
                pnr, waitlist_position, booking_class, days=7
            )
            
            return {
                "success": True,
                "pnr": pnr,
                "tracking": tracking_result,
                "simulation": progression_result,
                "agentActivities": self.execution_log
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_agent_activity_log(self) -> List[Dict]:
        """Get complete agent activity log from this session"""
        return self.execution_log
    
    def get_session_summary(self) -> Dict:
        """Get summary of this orchestration session"""
        return {
            "sessionId": self.session_id,
            "agentsInitialized": 10,
            "activitiesLogged": len(self.execution_log),
            "successfulActivities": sum(
                1 for a in self.execution_log if a.get("status") == "completed"
            ),
            "failedActivities": sum(
                1 for a in self.execution_log if a.get("status") == "failed"
            ),
            "activities": [
                {
                    "agent": a.get("agent"),
                    "action": a.get("action"),
                    "status": a.get("status")
                }
                for a in self.execution_log
            ]
        }
    
    def _wrap_failure(self, results: Dict, error_message: str) -> Dict:
        """Wrap failure response"""
        results["success"] = False
        results["error"] = error_message
        results["agentActivities"] = self.execution_log
        results["endTime"] = datetime.utcnow().isoformat()
        return results
