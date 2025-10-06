"""Luxor AI agent: rule-based retrieval with optional LLM summarisation."""
from __future__ import annotations

import json
import os
import re
from datetime import datetime
from statistics import mean
from typing import Any, Dict, List, Optional

from .data_store import LuxorDataStore

try:
    import ollama  # type: ignore
except Exception:  # pragma: no cover - ollama is optional at runtime
    ollama = None


class LuxorAgent:
    """Hybrid rule-based + LLM agent with enhanced general knowledge support."""

    def __init__(
        self,
        data_store: Optional[LuxorDataStore] = None,
        ollama_host: Optional[str] = None,
        model: Optional[str] = None,
    ) -> None:
        self.data_store = data_store or LuxorDataStore()
        self.ollama_host = ollama_host or os.environ.get("OLLAMA_HOST", "http://localhost:11434")
        self.model = model or os.environ.get("OLLAMA_MODEL", "phi3:mini")

        if ollama is not None:
            try:
                self.client = ollama.Client(self.ollama_host)
                # Test the connection
                self.client.show(self.model)
                self.llm_available = True
            except Exception:
                self.client = None
                self.llm_available = False
        else:
            self.client = None
            self.llm_available = False

    def gather_context(self, question: str, limit: int = 5) -> Dict[str, List[Dict]]:
        """Return structured rows per dataset relevant to the question."""
        return self.data_store.search(question, limit=limit)

    def answer(
        self,
        question: str,
        *,
        limit: int = 5,
        use_llm: bool = True,
    ) -> Dict[str, Any]:
        if self._is_greeting(question):
            return self._build_greeting_response(question)

        context = self.gather_context(question, limit=limit)
        has_data = any(context.get(section) for section in ("illumination", "barangays", "streets"))
        llm_used = False

        # Enhanced special handling with better pattern matching
        qnorm = question.strip().lower()
        barangay_names = sorted({b.get("name") for b in context.get("barangays", []) if b.get("name")})
        street_names = sorted({s.get("name") for s in context.get("streets", []) if s.get("name")})
        
        # Enhanced pattern matching for general knowledge questions
        if self._is_general_knowledge_question(qnorm):
            if use_llm and self.client and self.llm_available:
                return self._handle_general_knowledge_question(question, context)
        
        # IMPROVED: More robust pattern matching for list requests
        def _matches_list_pattern(text, target):
            """Check if text matches list patterns for the target."""
            patterns = [
                rf"list\s+(all\s+)?{target}",  # "list barangay", "list all barangay"
                rf"list\s+of\s+(all\s+)?{target}",  # "list of barangay", "list of all barangay"  
                rf"all\s+{target}",  # "all barangay"
                rf"what\s+{target}",  # "what barangay"
                rf"which\s+{target}",  # "which barangay"
                rf"show\s+{target}",  # "show barangay"
                rf"{target}\s+in\s+dataset",  # "barangay in dataset"
                rf"{target}\s+list",  # "barangay list"
                rf"available\s+{target}",  # "available barangay"
            ]
            return any(re.search(pattern, text) for pattern in patterns)
        
        # Check for barangay list requests
        if _matches_list_pattern(qnorm, "barangay") and barangay_names:
            answer_text = f"There are {len(barangay_names)} barangays in your dataset:\n" + "\n".join([f"• {name}" for name in barangay_names])
            data_source = "Structured dataset only"
        # Check for street list requests  
        elif _matches_list_pattern(qnorm, "street") and street_names:
            answer_text = f"There are {len(street_names)} streets in your dataset:\n" + "\n".join([f"• {name}" for name in street_names])
            data_source = "Structured dataset only"
        # Check for count requests
        elif (
            ("how many barangay" in qnorm or "number of barangay" in qnorm or "count barangay" in qnorm)
            and barangay_names
        ):
            answer_text = f"There are {len(barangay_names)} barangays in your dataset."
            data_source = "Structured dataset only"
        elif (
            ("how many street" in qnorm or "number of street" in qnorm or "count street" in qnorm)
            and street_names
        ):
            answer_text = f"There are {len(street_names)} streets in your dataset."
            data_source = "Structured dataset only"
        else:
            # Default: summary or fallback
            if has_data:
                answer_text = self._format_structured_summary(context)
                data_source = "Structured dataset only"
            else:
                answer_text = "No matching data found in your dataset."
                
                # Enhanced LLM fallback with better prompting
                if use_llm and self.client and self.llm_available:
                    is_general = self._is_general_knowledge_question(qnorm)
                    messages = self._build_smart_prompt(context, question, is_general_knowledge=is_general)
                    try:
                        response = self.client.chat(model=self.model, messages=messages)
                        llm_answer = response.get("message", {}).get("content", "")
                        if llm_answer:
                            # Apply corrections for known factual errors
                            llm_answer = self._validate_and_correct_response(question, llm_answer)
                            
                            if is_general:
                                answer_text += f"\n\n📚 Based on general knowledge:\n{llm_answer.strip()}"
                                data_source = "LLM general knowledge"
                            else:
                                answer_text += f"\n\n🤖 AI analysis:\n{llm_answer.strip()}"
                                data_source = "LLM analysis of available context"
                            llm_used = True
                        else:
                            data_source = "No data available"
                    except Exception as exc:
                        answer_text += f"\n\n❌ LLM call failed: {exc}"
                        data_source = "No data available"
                else:
                    data_source = "No data available"

        # Enhanced data source note
        answer_text = answer_text.strip() + f"\n\n📊 Data source: {data_source}"

        return {
            "question": question,
            "answer": answer_text,
            "context": context,
            "model": self.model if llm_used else None,
            "used_llm": llm_used,
            "llm_available": self.llm_available,
        }

    def _is_general_knowledge_question(self, question_lower: str) -> bool:
        """Enhanced detection of general knowledge questions."""
        # Specific patterns that phi3:mini can answer from its training
        general_patterns = [
            r'how many barangay (in|are there in) balanga',
            r'population of balanga',
            r'who is the mayor of balanga',
            r'when was balanga (founded|established|created)',
            r'what province is balanga in',
            r'how many people live in balanga',
            r'what is the area of balanga',
            r'barangays of balanga',
            r'list of barangay in balanga',
            r'what is lux',
            r'how to measure light',
            r'street light standards',
            r'ideal lux level for streets',
            r'lighting regulations',
            r'road categories',
            r'types of roads',
            r'highway standards',
            r'residential road standards',
            r'what is bataan',
            r'where is bataan',
            r'history of bataan',
            r'category.*road',
            r'standard lux',
        ]
        
        # General concepts about roads and lighting standards
        general_concepts = {
            'road category', 'road classification', 'highway', 'residential', 'main road',
            'standard lux', 'lux standard', 'lighting standard', 'illumination standard',
            'what is', 'explain', 'define', 'tell me about', 'category', 'type'
        }
        
        # Check specific patterns first
        if any(re.search(pattern, question_lower) for pattern in general_patterns):
            return True
            
        # Check for general concept questions
        question_words = set(question_lower.split())
        if general_concepts.intersection(question_words):
            return True
        
        # General keyword-based detection
        general_keywords = {
            'population', 'how many people', 'residents', 
            'mayor', 'governor', 'official', 
            'history', 'founded', 'established',
            'number of', 'total', 'count',
            'what is', 'how to', 'what are', 'explain', 'define',
            'category', 'classification', 'standard', 'regulation'
        }
        
        balanga_keywords = {'balanga', 'bataan', 'philippines'}
        
        # If question contains general knowledge patterns, use LLM
        if (any(kw in question_lower for kw in balanga_keywords) and 
            any(kw in question_lower for kw in general_keywords)):
            return True
            
        return False

    def _validate_and_correct_response(self, question: str, response: str) -> str:
        """Basic validation to catch obvious factual errors."""
        response_lower = response.lower()
        
        # Known corrections for common errors
        corrections = {
            'western visayas': 'Central Luzon',
            'bataan is in western visayas': 'Bataan is in Central Luzon region',
            'bataan del pampanga': 'Bataan was historically part of Pampanga province',
            'zambales to the west': 'Zambales to the northwest',
            'quezon city to the southwest': 'Pampanga and Bulacan to the northeast',
        }
        
        # Geographic fact validation
        geographic_facts = {
            'bataan is in central luzon': True,
            'balanga is the capital of bataan': True,
            'bataan has 11 municipalities and 1 city': True,
        }
        
        corrected_response = response
        for wrong, correct in corrections.items():
            if wrong in response_lower:
                corrected_response = corrected_response.replace(wrong, correct)
                # Also replace case variations
                corrected_response = re.sub(
                    re.escape(wrong), 
                    correct, 
                    corrected_response, 
                    flags=re.IGNORECASE
                )
            
        return corrected_response

    def _handle_general_knowledge_question(self, question: str, context: Dict) -> Dict[str, Any]:
        """Handle general knowledge questions with validation."""
        messages = [
            {
                "role": "system", 
                "content": (
                    "You are Luxor, a helpful assistant for Balanga, Bataan. "
                    "Answer this general knowledge question accurately and concisely. "
                    "**Important Geographic Facts:**\n"
                    "- Bataan is in Central Luzon region, Philippines\n"
                    "- Balanga City is the capital of Bataan\n"
                    "- Bataan has 11 municipalities and 1 component city\n"
                    "- Bataan is known for the Bataan Death March in WWII\n\n"
                    "If unsure about specific facts, acknowledge uncertainty. "
                    "For technical standards, provide general guidelines but note local variations may apply. "
                    "Provide factual information and avoid speculation."
                )
            },
            {
                "role": "user", 
                "content": f"Question: {question}\n\nPlease provide a helpful and accurate answer based on your knowledge."
            }
        ]
        
        try:
            response = self.client.chat(model=self.model, messages=messages)
            answer_text = response.get("message", {}).get("content", "").strip()
            
            # Apply corrections for known issues
            answer_text = self._validate_and_correct_response(question, answer_text)
            
            if not answer_text:
                answer_text = "I couldn't generate a response for this general knowledge question."
            
            return {
                "question": question,
                "answer": f"📚 {answer_text}\n\n📊 Data source: LLM general knowledge",
                "context": context,
                "model": self.model,
                "used_llm": True,
                "llm_available": True,
            }
            
        except Exception as exc:
            return {
                "question": question,
                "answer": f"❌ Failed to answer general knowledge question: {exc}\n\n📊 Data source: Error",
                "context": context,
                "model": None,
                "used_llm": False,
                "llm_available": self.llm_available,
            }

    def _build_smart_prompt(self, context: Dict[str, List[Dict]], question: str, is_general_knowledge: bool = False) -> List[Dict[str, str]]:
        """Build appropriate prompt based on question type."""
        if is_general_knowledge:
            return [
                {
                    "role": "system", 
                    "content": (
                        "You are Luxor, a helpful assistant for Balanga, Bataan. "
                        "Answer this general knowledge question based on your training data. "
                        "**Key Facts:** Bataan is in Central Luzon, Philippines. Balanga is its capital. "
                        "Be accurate and concise. If uncertain, acknowledge limitations. "
                        "For technical standards, provide general guidelines but note local variations."
                    )
                },
                {
                    "role": "user", 
                    "content": f"Question: {question}\n\nPlease provide a helpful and accurate answer."
                }
            ]
        else:
            # Use your existing prompt logic for dataset questions
            return build_prompt(context, question, allow_fallback=True)

    @staticmethod
    def _is_greeting(question: str) -> bool:
        simplified = re.sub(r"[^a-z\s]", " ", question.lower()).strip()
        if not simplified:
            return False

        simplified = re.sub(r"\s+", " ", simplified)
        tokens = simplified.split()
        if not tokens:
            return False

        greeting_tokens = {"hi", "hello", "hey", "greetings", "kumusta", "kamusta", "thanks", "thank"}
        domain_tokens = {
            "illumination",
            "lux",
            "lighting",
            "street",
            "streets",
            "barangay",
            "barangays",
            "sensor",
            "sensors",
            "reading",
            "readings",
            "light",
            "lights",
            "coverage",
            "lamp",
            "lamps",
            "intensity",
            "brightness",
            "data",
            "details",
        }

        if len(tokens) <= 4 and any(token in greeting_tokens for token in tokens):
            if not any(token in domain_tokens for token in tokens):
                return True

        phrases = {
            "good morning",
            "good afternoon",
            "good evening",
            "good day",
            "thank you",
        }
        for phrase in phrases:
            if simplified.startswith(phrase) and len(tokens) <= 6:
                return not any(token in domain_tokens for token in tokens)

        return False

    @staticmethod
    def _build_greeting_response(question: str) -> Dict[str, Any]:
        reply = (
            "Hello! I'm Luxor AI, your assistant for Balanga street lighting data.\n\n"
            "**I can show you data from your dataset:**\n"
            "• list all barangay - See available barangays\n"
            "• list all street - See available streets  \n"
            "• show me dark areas - Lighting analysis\n"
            "• priority areas - Maintenance recommendations\n\n"
            "**Or ask general questions:**\n"
            "• How many barangays in Balanga?\n"
            "• What are road categories?\n"
            "• Lighting standards for streets?\n\n"
            "What would you like to know?"
        )
        return {
            "question": question,
            "answer": reply,
            "context": {"illumination": [], "barangays": [], "streets": []},
            "model": None,
            "used_llm": False,
            "llm_available": True,
        }

    @staticmethod
    def _format_structured_summary(context: Dict[str, List[Dict]]) -> str:
        def _coerce_float(value: Optional[float]) -> Optional[float]:
            try:
                return float(value)
            except (TypeError, ValueError):
                return None

        def _parse_timestamp(value: Optional[str]) -> Optional[datetime]:
            if not value:
                return None
            try:
                cleaned = value.replace("Z", "+00:00") if isinstance(value, str) else value
                return datetime.fromisoformat(cleaned)
            except Exception:
                return None

        def _format_date(ts: Optional[datetime]) -> Optional[str]:
            if not ts:
                return None
            try:
                return ts.strftime("%b %d, %Y")
            except Exception:
                return ts.isoformat()

        def _bullet(lines: List[str]) -> str:
            cleaned: List[str] = []
            for line in lines:
                if not line:
                    continue
                stripped = line.rstrip().rstrip(". ")
                cleaned.append(f"• {stripped}")
            return "\n".join(cleaned)

        illum = context.get("illumination", []) or []
        streets = context.get("streets", []) or []
        barangays = context.get("barangays", []) or []

        street_names = {rec.get("id"): rec.get("name") for rec in streets if rec.get("id") is not None and rec.get("name")}
        barangay_names = {
            rec.get("id"): rec.get("name") for rec in barangays if rec.get("id") is not None and rec.get("name")
        }

        lux_values = [val for rec in illum if (val := _coerce_float(rec.get("lux"))) is not None]
        timestamp_values = [ts for rec in illum if (ts := _parse_timestamp(rec.get("created_at"))) is not None]
        sensors = sorted({str(rec.get("sensor")).strip() for rec in illum if rec.get("sensor")})

        def _resolve_street(rec: Dict[str, Any]) -> str:
            return (
                street_names.get(rec.get("street_id"))
                or rec.get("street")
                or rec.get("name")
                or (f"Street {rec.get('street_id')}" if rec.get("street_id") is not None else "Unnamed street")
            )

        def _resolve_barangay(rec: Dict[str, Any]) -> Optional[str]:
            return (
                barangay_names.get(rec.get("barangay_id"))
                or rec.get("barangay")
                or rec.get("name")
            )

        sections: List[str] = []

        if not (illum or streets or barangays):
            return "No matching rows were found in the data store."

        # 💡 Summary ----------------------------------------------------------
        summary_lines: List[str] = []
        if barangays:
            primary_barangay = list(barangay_names.values())[0]
            suffix = "" if len(barangays) == 1 else f" · {len(barangays)} barangays referenced"
            summary_lines.append(f"Focus {primary_barangay}{suffix}")
        elif streets:
            primary_street = _resolve_street(streets[0])
            summary_lines.append(f"Focus area around {primary_street}")

        if lux_values:
            lux_min = min(lux_values)
            lux_max = max(lux_values)
            lux_avg = mean(lux_values)
            span = f"range {lux_min:.1f}–{lux_max:.1f}" if lux_min != lux_max else f"steady {lux_avg:.1f}"
            summary_lines.append(f"Lux {span} · avg {lux_avg:.1f} · {len(illum)} readings")

        if timestamp_values:
            earliest = _format_date(min(timestamp_values))
            latest = _format_date(max(timestamp_values))
            if earliest and latest:
                summary_lines.append(f"Sampling window {earliest}{'' if earliest == latest else f' – {latest}'}")

        if streets and sensors:
            summary_lines.append(f"Coverage {len(streets)} streets · {len(sensors)} sensors active")
        elif streets:
            summary_lines.append(f"Coverage {len(streets)} streets")
        elif sensors:
            summary_lines.append(f"Sensors active {len(sensors)} units")

        if summary_lines:
            sections.append("💡 Summary\n" + _bullet(summary_lines[:3]))

        # 🌙 Lighting insights -------------------------------------------------
        lighting_lines: List[str] = []
        if lux_values:
            brightest_rec = max(illum, key=lambda rec: _coerce_float(rec.get("lux")) or float("-inf")) if illum else None
            dimmest_rec = min(illum, key=lambda rec: _coerce_float(rec.get("lux")) or float("inf")) if illum else None

            if brightest_rec:
                street = _resolve_street(brightest_rec)
                sensor = brightest_rec.get("sensor")
                lux_val = _coerce_float(brightest_rec.get("lux"))
                sensor_str = f" · sensor {sensor}" if sensor else ""
                lighting_lines.append(f"Brightest {street}{sensor_str} · {lux_val:.1f} lux" if lux_val is not None else f"Brightest {street}{sensor_str}")

            if dimmest_rec and dimmest_rec is not brightest_rec:
                street = _resolve_street(dimmest_rec)
                sensor = dimmest_rec.get("sensor")
                lux_val = _coerce_float(dimmest_rec.get("lux"))
                sensor_str = f" · sensor {sensor}" if sensor else ""
                lighting_lines.append(f"Dimmest {street}{sensor_str} · {lux_val:.1f} lux" if lux_val is not None else f"Dimmest {street}{sensor_str}")

            if len(sensors) > 1:
                lighting_lines.append(f"Sensors compared {len(sensors)} models")
            elif sensors:
                lighting_lines.append(f"Single sensor model {next(iter(sensors))}")

        if lighting_lines:
            sections.append("🌙 Lighting insights\n" + _bullet(lighting_lines))

        # 🔧 Recommendations ---------------------------------------------------
        recommendation_lines: List[str] = []
        if lux_values:
            lux_avg = mean(lux_values)
            lux_min = min(lux_values)
            lux_max = max(lux_values)
            dimmest_rec = min(illum, key=lambda rec: _coerce_float(rec.get("lux")) or float("inf")) if illum else None
            brightest_rec = max(illum, key=lambda rec: _coerce_float(rec.get("lux")) or float("-inf")) if illum else None

            if dimmest_rec:
                street = _resolve_street(dimmest_rec)
                recommendation_lines.append(f"Boost fixtures along {street} to lift low spots")

            if lux_max - lux_min >= 5 and brightest_rec and dimmest_rec:
                bright_street = _resolve_street(brightest_rec)
                dim_street = _resolve_street(dimmest_rec)
                recommendation_lines.append(f"Balance output between {bright_street} and {dim_street}")

            if lux_avg < 30:
                recommendation_lines.append("Schedule calibration to raise overall brightness")

        if not recommendation_lines:
            recommendation_lines.append("Maintain current lighting cadence and monitor sensors")

        sections.append("🔧 Recommendations\n" + _bullet(recommendation_lines[:3]))

        return "\n\n".join(sections)


def build_prompt(context: Dict[str, List[Dict]], question: str, allow_fallback: bool = False) -> List[Dict[str, str]]:
    """Create an Ollama-compatible chat prompt for Luxor's hybrid barangay analysis."""
    if allow_fallback:
        system_message = (
            "You are Luxor, a barangay data analyst. Some structured data may be incomplete. "
            "You MAY infer likely patterns, but label uncertain or estimated parts clearly. "
            "Avoid fabricating sensor IDs, timestamps, or unverifiable figures. "
            "Respond in three concise sections with emoji headings:\n"
            "💡 Summary, 🌙 Lighting insights, 🔧 Recommendations.\n"
            "Each section: up to 3 short bullet fragments, no trailing periods. "
            "Your answer must strictly follow this format:\n"
            "💡 Summary:\n• ...\n🌙 Lighting insights:\n• ...\n🔧 Recommendations:\n• ..."
        )
    else:
        system_message = (
            "You are Luxor, a barangay data analyst. Use ONLY the provided structured data. "
            "If something is missing, acknowledge it and suggest what to collect next. "
            "Respond in three concise sections with emoji headings:\n"
            "💡 Summary, 🌙 Lighting insights, 🔧 Recommendations.\n"
            "Each section: up to 3 short bullet fragments, no trailing periods."
        )

    user_payload = {
        "question": question,
        "illumination": context.get("illumination", []),
        "barangays": context.get("barangays", []),
        "streets": context.get("streets", []),
    }

    return [
        {"role": "system", "content": system_message},
        {"role": "user", "content": f"Structured data for analysis:\n```json\n{json.dumps(user_payload, ensure_ascii=False, indent=2)}\n```\nQuestion: {question}\nAnswer succinctly."},
    ]
