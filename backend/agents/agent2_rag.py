from rag.retriever import retrieve_context

def run(category: str, keywords: str) -> str:
    print("Agent 2: RAG Retrieval")
    query = f"{category} issues related to {keywords}"
    context = retrieve_context(query)
    return context
