import asyncio
from os import getenv

from dotenv import load_dotenv
from google import genai
from google.genai import types

# used by the generated code
from manim import *  # noqa

load_dotenv()

client = genai.Client(api_key=getenv("GEMINI_API_KEY"))

# system prompts
query_to_explanation = """You are an expert math and physics tutor. The user will provide a specific math or physics concept or question. Your task is to produce a structured, step-by-step explanation that teaches the concept in a clear and detailed way at the user’s indicated level of knowledge. Your explanation should include:

1. A brief restatement of the topic or question.
2. Key definitions and relevant background information.
3. Step-by-step derivations, logical reasoning, or proofs as needed.
4. Useful equations, with short clarifications of the symbols.
5. A concise conclusion or recap of the main idea(s).

Important requirements:
- Do not include Python code in this response.
- Focus on conceptual clarity—imagine you are writing a short “script” that explains the topic in a way that will guide a future animation.
- Keep the explanation logically organized so that it can be converted into an animation sequence later.
- Provide any necessary clarifications or examples that might help illustrate the concept visually."""

explanation_to_code = """You are acting as a Python Manim developer. You will receive an explanation of a math or physics concept from a previous step. Using that explanation, produce a Manim scene that visually illustrates the concept.

The resulting output must:
1. Be valid Python code runnable in Manim (assume Manim CE or a specified version).
2. Contain all necessary imports (e.g., `from manim import *`) and class definitions.
3. Show the concept in a clear, instructional way—include text, shapes, formulas, highlights, animations, and transitions as appropriate.
4. Use descriptive class and method names. The scene's class name must be "Animation". (e.g., `class Animation(Scene):`).
5. Avoid extraneous commentary—only output the code.

Important details:
- Do not provide any explanation about the code. Only supply the code itself.
- You can assume that this code will be programmatically extracted and run, so keep it self-contained.
- Include explanatory text in the animation (e.g., `Tex`, `MathTex`, `Text`) to reflect important points from the explanation.
- Adhere to Python/Manim syntax standards so that the code runs without modification."""

moderation= """You are acting as an expert content moderator for an online social media platform. You will recieve a message, and will need to identify it as being in one of three categories: good, bad or None.

The resulting output must:
1. either "GOOD" or "BAD" or "NONE" without the quotations. Followed by a dot

Important details:
- you are to respond with "GOOD" if the question is appropriate and relevant to phyics or math
- you are to respond with "BAD" if the question is inappropiate or irrelevant to physics or math
- you are to respond with "NONE" if you cannot understand the message.

"""

identify_relevant_details = """You are acting as a math & physics teacher. You will recieve a message and you need to identify important key phrases that correspond to specific topics in math or physics.

The resulting output must:
1. consist of a single sentence consisting of the key phrase. Followed by a dot


Important details:
- if no important ideas can be identified, respond with just a dot
- if two key phrases seem closely related enough, then that counts as multiple
- if multiple key phrases are identified, respond with "too many ideas", followed by a dot 
"""

identify_strategy = """You are acting as a math & physics teacher. You will recieve a series of messages and will need to pretend its from a student Respond with either "QUERY", "ANSWER", or "INSPIRE"


The resulting output must:
1. either "QUERY", "ANSWER", or "INSPIRE" without the quotations, followed by a dot

Important details:

- Respond with "QUERY" if given the messages, you feel like you need more context to determine what to teach.
- Respond with "INSPIRE" if given the messages, you feel like you need to take the initiative to choose something to teach on your own.
- Respond with "ANSWER" if you can identify something specific that the student wants to learn about. Be strict about this, if the messages are vague, respond with "QUERY"
- if there are no messages in the list, always respond with "QUERY" 

"""
async def moderate_input(contents: str):
    return await generate_content(contents=contents, system_instruction = moderation, stop_sequences = ["."])


async def generate_content(
    contents: str | list[str],
    system_instruction: str,
    stop_sequences: list[str] | None = None,
) -> str:
    response = await client.aio.models.generate_content(
        model="gemini-2.0-flash-exp",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0,
            stop_sequences=stop_sequences,
        ),
    )
    return response.text


def generate_content_sync(
    contents: str | list[str],
    system_instruction: str,
    stop_sequences: list[str] | None = None,
) -> str:
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0,
            stop_sequences=stop_sequences,
        ),
    )
    return response.text


class Animation:
    def render(self) -> None:
        print("Default render method")


def render_video(code: str) -> None:
    exec(code)


async def generate_code(query: str) -> str:
    explanation = await generate_content(query, query_to_explanation)
    print("Received explanation")

    code = await generate_content(explanation, explanation_to_code)
    code = code.replace("```python", "").replace("```", "")
    code += "\nscene = Animation()\nscene.render()\n"
    print("Received code")

    render_video(code)
    print("Rendered video")

    return code


def generate_code_sync(query: str) -> str:
    explanation = generate_content_sync(query, query_to_explanation)
    print("Received explanation")

    code = generate_content_sync(explanation, explanation_to_code)
    code = code.replace("```python", "").replace("```", "")
    code += "\nscene = Animation()\nscene.render()\n"
    print("Received code")

    render_video(code)
    print("Rendered video")

    return code


# test code
if __name__ == "__main__":
    query: str = "Action reaction forces, newton's third law"
    asyncio.run(generate_code(query))
