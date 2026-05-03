import os
from typing import Literal

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

load_dotenv()


class IntakeSchema(BaseModel):
    category: Literal["water", "road", "garbage", "sewage", "other"] = Field(
        description="Single best category for this civic complaint in Islamabad",
    )
    keywords: str = Field(default="", description="Comma-separated keywords (Urdu or English)")
    language: Literal["urdu", "english", "mixed"] = Field(
        default="mixed",
        description="Main language of the complaint text",
    )
    summary: str = Field(default="", description="One short sentence summarizing the issue")


def run(text: str) -> dict:
    text = (text or "").strip()
    if not text:
        return {
            "category": "other",
            "keywords": "",
            "language": "english",
            "summary": "",
        }

    print("Agent 1: Intake & Classification")
    model = os.getenv("OPENAI_INTAKE_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    llm = ChatOpenAI(model=model, temperature=0)
    structured = llm.with_structured_output(IntakeSchema)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You classify civic complaints for Islamabad (AWAZ). "
                "Text may be Urdu, English, or mixed.\n"
                "Categories:\n"
                "- water: water supply, pipes, taps, shortage (پانی، پائپ)\n"
                "- road: potholes, broken roads, traffic, footpaths (سڑک، گڑھا)\n"
                "- garbage: waste, bins, collection, dumping (کوڑا، صفائی)\n"
                "- sewage: drains, gutters, overflow, smell (نالی، سیوریج)\n"
                "- other: anything else\n"
                "Pick exactly one category. Fill summary in the same language as the complaint when possible.",
            ),
            ("human", "Complaint:\n{text}"),
        ]
    )

    chain = prompt | structured
    try:
        out = chain.invoke({"text": text})
        data = out.model_dump()
        print(f"Agent 1: category={data.get('category')} language={data.get('language')}")
        return data
    except Exception as e:
        print(f"Agent 1 error: {e}")
        return {
            "category": "other",
            "keywords": "",
            "language": "mixed",
            "summary": text[:120],
        }
