# Genimo

![Genimo](/frontend/public/whitebglogo.png)

3Blue1Brown animations with the click of a finger

## Inspiration

A key inspiration for this project was the YouTuber [3Blue1Brown](https://www.youtube.com/@3blue1brown); his educational videos on topics such as math and physics motivated us to create this project.

## What it does

Genimo is a project that utilizes AI and animation to turn user-provided text into educational animations. Users can input questions or queries about math and physics concepts, which the program then processes to create animation videos explaining the concept within minutes.

## How we built it

We utilized the [Manim](https://www.manim.community/) library created by YouTuber [3Blue1Brown](https://www.youtube.com/@3blue1brown) to create animations for our projects. Flask served as the backend, and NextJS served as the frontend. Lastly, we stored conversations in MongoDB, making it easy to track user interactions.

The processing of the videos is as follows:

1. The user inputs a concept or a question about a concept.
2. We use Gemini 2.0 Flash to refine the query into a more specific concept which can be explained.
3. Gemini is used to explain the concept extensively with steps of understanding.
4. Gemini generates Manim code based on the explanation, conveying it step-by-step as animations.
5. The generated code is executed and the video is rendered through the Manim library.
6. The video is shown on the frontend.

## Challenges we ran into

During this hackathon, we faced several challenges. One of the main issues was effectively prompting Gemini to generate the most optimal code for our animations in Manim. Additionally, we encountered difficulties uploading our video files from the backend to the frontend. We also struggled with configuring and downloading all the necessary files for Manim to function correctly.

## Accomplishments that we're proud of

We are proud of how we successfully integrated everything together, particularly the integration of GenAI. While Gemini was a powerful tool, fine-tuning its outputs to meet our specific needs for Manim animations required lots of testing and adjustments. Additionally, building a full-stack project with a smooth user experience within a short timeframe proved to be demanding.

## What we learned

This project showcased the power of GenAI, particularly with tools like Gemini that accelerate development and simplify workflows and code generation. Additionally, working collaboratively under pressure highlighted the importance of clear communication and effective task delegation within our team.

## What's next for Genimo

Our goal is to enhance AI integration by improving the AI's understanding of user input, leading to better animations and explanations. We will also introduce customization options that allow users to adjust and personalize animations to their preferences. Additionally, we plan to connect this program to the Instagram API to post various animations about different concepts. Lastly, we aim to move the project from a localhost setup to a scalable server for better accessibility and performance.
