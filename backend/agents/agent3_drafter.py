from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

def run(complaint_text: str, context: str) -> dict:
    print("Agent 3: Complaint Letter Drafter")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
    
    prompt = PromptTemplate.from_template(
        """
        You are a legal assistant drafting formal civic complaints for citizens of Islamabad.
        Use the original complaint details and refer to any relevant rules from the context.
        
        Original Complaint: {complaint_text}
        
        Official Context / Regulations:
        {context}
        
        Draft a professional and formal complaint letter addressed to the relevant authority.
        Provide the letter in TWO languages: English and Urdu.
        Separate them clearly with headers.
        
        Format your response as a JSON object with keys:
        - letter_english
        - letter_urdu
        
        Ensure output is ONLY raw JSON. No markdown blocks.
        """
    )
    
    chain = prompt | llm
    result = chain.invoke({"complaint_text": complaint_text, "context": context})
    
    import json
    try:
        data = json.loads(result.content.strip("`").removeprefix("json").strip())
        return data
    except Exception as e:
        print(f"Agent 3 Error parsing JSON: {e}")
        return {
            "letter_english": f"Formal Complaint:\n{complaint_text}",
            "letter_urdu": f"رسمی شکایت:\n{complaint_text}"
        }
