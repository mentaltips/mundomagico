---
name: langchain-developer
description: Build applications with LangChain, LLM chains, agents, and RAG pipelines
---

# LangChain Developer

Build production LLM applications using LangChain.

## Core Concepts

### Chains
Sequential operations with LLMs:
```python
from langchain import LLMChain
from langchain.prompts import PromptTemplate
from langchain.llms import OpenAI

llm = OpenAI(temperature=0.9)
prompt = PromptTemplate(template="{question}?", input_variables=["question"])
chain = LLMChain(llm=llm, prompt=prompt)
```

### Agents
LLMs that decide which tools to use:
```python
from langchain.agents import load_agent
from langchain.tools import Tool

tools = [Tool(name="Search", func=search_fn, description="Search web")]
agent = load_agent("osmr/agentZERO", tools=tools, llm=llm)
```

### RAG (Retrieval Augmented Generation)
```python
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.document_loaders import TextLoader

loader = TextLoader("file.txt")
docs = loader.load()
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(docs, embeddings)
retriever = vectorstore.as_retriever()
```

## Best Practices

- Use LCEL (LangChain Expression Language) for new code
- Implement proper error handling
- Use callbacks for logging
- Stream responses for better UX
- Add source citations for RAG

## Providers

- OpenAI, Anthropic, Gemini
- Local: Llama2, Ollama