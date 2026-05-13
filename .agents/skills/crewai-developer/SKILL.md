---
name: crewai-developer
description: Build multi-agent AI systems with CrewAI for collaborative task completion
---

# CrewAI Developer

Build teams of AI agents that work together to complete complex tasks.

## Core Concepts

### Crew
A team of agents with roles:
```python
from crewai import Agent, Crew, Task

researcher = Agent(
    role="Researcher",
    goal="Find accurate information",
    backstory="Expert researcher",
    tools=[search_tool]
)

writer = Agent(
    role="Writer",
    goal="Write compelling content",
    backstory="Expert writer"
)
```

### Tasks
Define work for agents:
```python
task = Task(
    description="Research AI trends",
    agent=researcher,
    expected_output="Detailed research report"
)
```

### Crew Execution
```python
crew = Crew(
    agents=[researcher, writer],
    tasks=[task1, task2],
    process="sequential"  # or "hierarchical"
)

result = crew.kickoff()
```

## Process Types

- **sequential:** Tasks run one after another
- **hierarchical:** Manager delegates to agents

## Best Practices

- Give clear goals to each agent
- Use complementary tools
- Set appropriate verbose=True for debugging
- Implement human-in-the-loop for approvals

## Use Cases

- Research + Writing teams
- Code review + Security audit
- Marketing + Content creation