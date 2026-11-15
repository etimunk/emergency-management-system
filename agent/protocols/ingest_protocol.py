import os
# טעינת המפתח ישירות מה-config שלך
from config import OPENAI_API_KEY
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# הגדרת מפתח ה-API במערכת - חובה עבור OpenAI Embeddings!
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY


def ingest_all_protocols():
    print("--- מתחיל תהליך Ingestion וקטורי אמיתי (RAG) ---")

    # 1. שלושת הנתיבים המלאים שלך
    pdf_paths = [
        r"C:\Users\user1\Desktop\emergency_project1\agent\מדא פרוטוקל חרום.pdf",
        r"C:\Users\user1\Desktop\emergency_project1\agent\פרוטוקול אסונות מדא.pdf",
        r"C:\Users\user1\Desktop\emergency_project1\agent\פרוטוקול משטרה.pdf",
    ]

    all_documents = []

    # 2. טעינת הקבצים
    for path in pdf_paths:
        if not os.path.exists(path):
            print(f"⚠️ קובץ לא נמצא בסטטוס: {path}")
            continue
        print(f"📖 טוען את: {os.path.basename(path)}...")
        loader = PyPDFLoader(path)
        all_documents.extend(loader.load())

    print(f"✅ נטענו סך הכל {len(all_documents)} עמודי פרוטוקול.")

    # 3. פירוק הטקסט לחתיכות (Chunks) עבור ה-Vector DB
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200
    )
    chunks = text_splitter.split_documents(all_documents)
    print(f"✂️ הטקסט חולק ל-{len(chunks)} חתיכות (Chunks).")

    # 4. יצירת Embeddings בעזרת OpenAI ושמירה ל-Chroma DB
    print("🧠 מייצר וקטורים (Embeddings) מול OpenAI ושומר לדיסק...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    # יצירת התיקייה chroma_db ממש בשורש הפרויקט
    vector_db = Chroma.from_documents(
        documents=chunks, embedding=embeddings, persist_directory="chroma_db"
    )

    print("🎉 ההמרה הוקטורית הסתיימה! תיקיית 'chroma_db' מוכנה לשימוש.")


if __name__ == "__main__":
    ingest_all_protocols()