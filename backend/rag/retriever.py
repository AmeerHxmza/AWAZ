import os
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'chroma_db')

_vectorstore = None

def get_retriever():
    global _vectorstore
    
    if _vectorstore is None:
        if not os.path.exists(CHROMA_DB_DIR):
            print("Chroma DB not found. Please run embed_documents.py first.")
            return None
            
        embeddings = OpenAIEmbeddings()
        _vectorstore = Chroma(persist_directory=CHROMA_DB_DIR, embedding_function=embeddings)
        
    return _vectorstore.as_retriever(search_kwargs={"k": 3})

def retrieve_context(query: str):
    retriever = get_retriever()
    if not retriever:
        return "No external context available."
        
    docs = retriever.invoke(query)
    context = "\n\n".join([doc.page_content for doc in docs])
    return context
