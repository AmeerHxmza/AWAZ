import os
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'chroma_db')
DOCS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'documents')

def embed_documents():
    print("Starting document embedding process...")
    
    # Ensure directory exists, even if empty
    os.makedirs(DOCS_DIR, exist_ok=True)
    
    # Try to load documents
    documents = []
    
    # Load Text files
    if os.path.exists(DOCS_DIR):
        txt_loader = DirectoryLoader(DOCS_DIR, glob="**/*.txt", loader_cls=TextLoader)
        try:
            documents.extend(txt_loader.load())
        except Exception as e:
            print(f"No txt files or error: {e}")
            
        # Load PDF files
        pdf_loader = DirectoryLoader(DOCS_DIR, glob="**/*.pdf", loader_cls=PyPDFLoader)
        try:
            documents.extend(pdf_loader.load())
        except Exception as e:
            print(f"No pdf files or error: {e}")

    if not documents:
        print("No documents found in 'data/documents/'. Creating a sample document for RAG testing...")
        sample_doc_path = os.path.join(DOCS_DIR, "sample_wasa_rules.txt")
        with open(sample_doc_path, "w", encoding="utf-8") as f:
            f.write("WASA Islamabad Regulations:\n1. All water leaks must be reported to WASA.\n2. Standard SLA for sewage fix is 48 hours.\n3. Contact: complaints@wasa.islamabad.pk\n")
        documents.extend(TextLoader(sample_doc_path).load())

    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_documents(documents)
    
    print(f"Split {len(documents)} documents into {len(docs)} chunks.")

    # Create embeddings and store in Chroma
    # Make sure OPENAI_API_KEY is in .env
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma.from_documents(docs, embeddings, persist_directory=CHROMA_DB_DIR)
    
    print("Documents embedded and vector database saved to:", CHROMA_DB_DIR)

if __name__ == "__main__":
    embed_documents()
