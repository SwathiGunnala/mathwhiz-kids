import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  timeout: 30000,
});

export interface StoryProblem {
  story: string;
  question: string;
  problemType: string;
  answer: number;
  options: number[];
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateOptions(answer: number): number[] {
  const options = new Set<number>();
  options.add(answer);
  while (options.size < 4) {
    const offset = getRandomInt(-5, 5);
    const distractor = answer + offset;
    if (distractor >= 0 && distractor !== answer) {
      options.add(distractor);
    }
  }
  return shuffleArray(Array.from(options));
}

function getGradeDifficulty(grade: string): number {
  const difficulties: Record<string, number> = { K: 1, "1": 2, "2": 3, "3": 4, "4": 5, "5": 6 };
  return difficulties[grade] || 1;
}

function generateBasicProblem(type: string, difficulty: number) {
  let num1: number, num2: number, answer: number, operator: string;
  switch (type) {
    case "addition":
      operator = "+";
      num1 = getRandomInt(1, 5 * difficulty);
      num2 = getRandomInt(1, 5 * difficulty);
      answer = num1 + num2;
      break;
    case "subtraction":
      operator = "-";
      num1 = getRandomInt(3 * difficulty, 10 * difficulty);
      num2 = getRandomInt(1, num1);
      answer = num1 - num2;
      break;
    case "multiplication":
      operator = "×";
      num1 = getRandomInt(1, 3 + difficulty);
      num2 = getRandomInt(1, 3 + difficulty);
      answer = num1 * num2;
      break;
    case "division":
      operator = "÷";
      num2 = getRandomInt(2, 3 + difficulty);
      answer = getRandomInt(1, 3 + difficulty);
      num1 = num2 * answer;
      break;
    default:
      operator = "+";
      num1 = getRandomInt(1, 5);
      num2 = getRandomInt(1, 5);
      answer = num1 + num2;
  }
  return { num1, num2, answer, operator };
}

interface GeometryProblem {
  answer: number;
  num1: number;
  num2: number;
  shape: string;
  concept: string;
}

function generateGeometryProblem(difficulty: number): GeometryProblem {
  const concepts = difficulty <= 2
    ? ["sides", "corners", "shape_identify"]
    : difficulty <= 4
    ? ["sides", "corners", "perimeter", "shape_identify"]
    : ["sides", "corners", "perimeter", "area", "shape_identify"];

  const concept = concepts[Math.floor(Math.random() * concepts.length)];

  switch (concept) {
    case "sides": {
      const shapes = [
        { name: "triangle", sides: 3 },
        { name: "square", sides: 4 },
        { name: "rectangle", sides: 4 },
        { name: "pentagon", sides: 5 },
        { name: "hexagon", sides: 6 },
        { name: "octagon", sides: 8 },
      ];
      const shape = shapes[Math.floor(Math.random() * Math.min(shapes.length, 2 + difficulty))];
      return { answer: shape.sides, num1: shape.sides, num2: 0, shape: shape.name, concept };
    }
    case "corners": {
      const shapes = [
        { name: "triangle", corners: 3 },
        { name: "square", corners: 4 },
        { name: "rectangle", corners: 4 },
        { name: "pentagon", corners: 5 },
        { name: "hexagon", corners: 6 },
      ];
      const shape = shapes[Math.floor(Math.random() * Math.min(shapes.length, 2 + difficulty))];
      return { answer: shape.corners, num1: shape.corners, num2: 0, shape: shape.name, concept };
    }
    case "perimeter": {
      const side = getRandomInt(2, 3 + difficulty);
      const numSides = [3, 4][Math.floor(Math.random() * 2)];
      const shapeNames: Record<number, string> = { 3: "triangle", 4: "square" };
      return {
        answer: side * numSides,
        num1: side,
        num2: numSides,
        shape: shapeNames[numSides],
        concept,
      };
    }
    case "area": {
      const length = getRandomInt(2, 3 + difficulty);
      const width = getRandomInt(2, 3 + difficulty);
      return { answer: length * width, num1: length, num2: width, shape: "rectangle", concept };
    }
    case "shape_identify": {
      const shapes = [
        { name: "triangle", sides: 3 },
        { name: "square", sides: 4 },
        { name: "pentagon", sides: 5 },
        { name: "hexagon", sides: 6 },
      ];
      const shape = shapes[Math.floor(Math.random() * Math.min(shapes.length, 2 + difficulty))];
      return { answer: shape.sides, num1: shape.sides, num2: 0, shape: shape.name, concept };
    }
    default: {
      return { answer: 3, num1: 3, num2: 0, shape: "triangle", concept: "sides" };
    }
  }
}

const problemTypes = [
  "word_problem",
  "real_world",
  "fill_blank",
  "comparison",
  "pattern",
];

const storyThemes = [
  { context: "at the playground", items: ["swings", "slides", "seesaws", "kids playing"] },
  { context: "at the bakery", items: ["cupcakes", "cookies", "muffins", "donuts"] },
  { context: "at the pet store", items: ["puppies", "kittens", "fish", "hamsters"] },
  { context: "in the garden", items: ["flowers", "butterflies", "ladybugs", "tomatoes"] },
  { context: "at the zoo", items: ["elephants", "monkeys", "penguins", "giraffes"] },
  { context: "in space", items: ["stars", "planets", "rockets", "astronauts"] },
  { context: "at the beach", items: ["seashells", "sandcastles", "crabs", "starfish"] },
  { context: "at a birthday party", items: ["balloons", "presents", "slices of cake", "party hats"] },
  { context: "at the grocery store", items: ["apples", "bananas", "oranges", "watermelons"] },
  { context: "at school", items: ["crayons", "pencils", "erasers", "notebooks"] },
  { context: "at the toy store", items: ["cars", "dolls", "blocks", "puzzles"] },
  { context: "at the farm", items: ["chickens", "cows", "pigs", "sheep"] },
];

function getOperationVerb(type: string): string {
  switch (type) {
    case "addition": return "adding";
    case "subtraction": return "taking away";
    case "multiplication": return "multiplying";
    case "division": return "dividing";
    case "geometry": return "measuring";
    default: return "working with";
  }
}

export async function generateStoryProblem(
  operationType: string,
  grade: string
): Promise<StoryProblem> {
  const difficulty = getGradeDifficulty(grade);

  if (operationType === "geometry") {
    return generateGeometryStoryProblem(difficulty, grade);
  }

  const { num1, num2, answer, operator } = generateBasicProblem(operationType, difficulty);
  const options = generateOptions(answer);
  const theme = storyThemes[Math.floor(Math.random() * storyThemes.length)];
  const item = theme.items[Math.floor(Math.random() * theme.items.length)];
  const problemType = problemTypes[Math.floor(Math.random() * problemTypes.length)];

  let promptInstructions = "";

  switch (problemType) {
    case "word_problem":
      promptInstructions = `Create a fun, short story problem (2-3 sentences) set ${theme.context} involving ${item}. 
The story should naturally lead the student to figure out the answer is ${answer} using ${operationType}.
Do NOT show the equation or numbers like "${num1} ${operator} ${num2}". The student must figure out the numbers from reading the story.
The question should ask them to find the answer based on the story.`;
      break;
    case "real_world":
      promptInstructions = `Create a realistic everyday scenario where a kid needs to use ${operationType}.
For example: counting coins, sharing snacks, arranging items in rows, measuring ingredients.
The scenario should lead to the answer ${answer}. Use numbers ${num1} and ${num2} naturally in the scenario.
Do NOT show the math equation. The student must read carefully to find the numbers and figure out what operation to use.`;
      break;
    case "fill_blank":
      promptInstructions = `Create a "fill in the blank" style problem about ${item} ${theme.context}.
Present it as: "There were ___ ${item}. After ${getOperationVerb(operationType)} ___ more, there are now ___."
Fill in two of the blanks with the correct numbers (${num1} and ${num2}) and leave the answer blank for the student.
The answer should be ${answer}. Do NOT show the equation directly.`;
      break;
    case "comparison":
      promptInstructions = `Create a comparison problem involving ${item} ${theme.context}.
For example: "Alex has X ${item}. Ben has Y ${item}. How many do they have together?" (for addition)
Or: "There are X ${item}. If Y are taken away, how many are left?" (for subtraction)
Use numbers ${num1} and ${num2}. The answer is ${answer}.
Make it a real-world comparison. Do NOT show the math equation.`;
      break;
    case "pattern":
      promptInstructions = `Create a pattern or grouping problem about ${item} ${theme.context}.
For multiplication: "There are ${num1} groups of ${num2} ${item}. How many ${item} in total?"
For division: "${num1} ${item} need to be shared equally among ${num2} friends. How many does each friend get?"
For addition: "${num1} ${item} in one place and ${num2} in another. How many altogether?"
For subtraction: "Started with ${num1} ${item}, gave away ${num2}. How many are left?"
The answer is ${answer}. Describe the pattern naturally without showing the equation.`;
      break;
  }

  try {
    const prompt = `You are creating a math problem for a ${grade === "K" ? "Kindergarten" : `Grade ${grade}`} student.
The operation type is ${operationType}.

${promptInstructions}

IMPORTANT RULES:
- Do NOT include the math equation (like "${num1} ${operator} ${num2} = ?") anywhere in the story or question.
- The student should need to READ and THINK to find the answer.
- Keep language simple and age-appropriate.
- Make it engaging and fun.

Respond in JSON format:
{
  "story": "The engaging story/scenario here...",
  "question": "The question asking for the answer..."
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 250,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        story: parsed.story,
        question: parsed.question,
        problemType,
        answer,
        options,
      };
    }
  } catch (error) {
    console.error("AI story generation failed, using fallback:", error);
  }

  const fallbackStories: Record<string, Record<string, string>> = {
    word_problem: {
      addition: `You are ${theme.context}. You count ${num1} ${item}. Then you spot ${num2} more ${item} nearby!`,
      subtraction: `There are ${num1} ${item} ${theme.context}. Some walk away and now there are only ${answer} left.`,
      multiplication: `${theme.context.charAt(0).toUpperCase() + theme.context.slice(1)}, you see ${num1} groups. Each group has ${num2} ${item}.`,
      division: `You have ${num1} ${item} to share equally among ${num2} friends ${theme.context}.`,
    },
    real_world: {
      addition: `You saved ${num1} stickers yesterday and got ${num2} more today.`,
      subtraction: `You had ${num1} ${item} in your collection but gave ${num2} to your friend.`,
      multiplication: `Each shelf ${theme.context} has ${num2} ${item}, and there are ${num1} shelves.`,
      division: `${num1} ${item} need to be packed into ${num2} equal boxes.`,
    },
    fill_blank: {
      addition: `There were ${num1} ${item}. After getting ${num2} more, there are now ___ ${item}.`,
      subtraction: `There were ${num1} ${item}. After ${num2} left, there are now ___ ${item}.`,
      multiplication: `${num1} bags with ${num2} ${item} each makes ___ ${item} in total.`,
      division: `${num1} ${item} split into ${num2} equal groups means ___ in each group.`,
    },
    comparison: {
      addition: `Emma has ${num1} ${item} and Jake has ${num2} ${item}.`,
      subtraction: `The store had ${num1} ${item} and sold ${num2} of them.`,
      multiplication: `There are ${num1} rows of ${item} with ${num2} in each row.`,
      division: `A teacher has ${num1} ${item} to give equally to ${num2} students.`,
    },
    pattern: {
      addition: `Count: ${num1} ${item} on the left, ${num2} ${item} on the right.`,
      subtraction: `Start with ${num1} ${item}. Remove ${num2}.`,
      multiplication: `${num1} groups of ${num2} ${item} each.`,
      division: `${num1} ${item} shared equally among ${num2} friends.`,
    },
  };

  const fallbackQuestions: Record<string, string> = {
    addition: `How many ${item} are there in total?`,
    subtraction: `How many ${item} are left?`,
    multiplication: `How many ${item} are there altogether?`,
    division: `How many ${item} does each person get?`,
  };

  const typeStories = fallbackStories[problemType] || fallbackStories.word_problem;

  return {
    story: typeStories[operationType] || `${num1} ${item} and ${num2} more ${item} ${theme.context}.`,
    question: fallbackQuestions[operationType] || `What is the answer?`,
    problemType,
    answer,
    options,
  };
}

async function generateGeometryStoryProblem(
  difficulty: number,
  grade: string
): Promise<StoryProblem> {
  const geoProblem = generateGeometryProblem(difficulty);
  const options = generateOptions(geoProblem.answer);

  let promptInstructions = "";

  switch (geoProblem.concept) {
    case "sides":
      promptInstructions = `Create a fun question about a ${geoProblem.shape}. 
The student needs to figure out how many sides a ${geoProblem.shape} has. The answer is ${geoProblem.answer}.
Use a real-world scenario like finding shapes in a classroom, park, or building.`;
      break;
    case "corners":
      promptInstructions = `Create a fun question about a ${geoProblem.shape}.
The student needs to count how many corners (vertices) a ${geoProblem.shape} has. The answer is ${geoProblem.answer}.
Use a relatable scenario like decorating shapes or building with blocks.`;
      break;
    case "perimeter":
      promptInstructions = `Create a story about a ${geoProblem.shape} where each side is ${geoProblem.num1} units long.
The student needs to find the total distance around the shape (perimeter). The answer is ${geoProblem.answer}.
Use a scenario like walking around a garden, building a fence, or putting ribbon around a shape.
Do NOT show the math equation.`;
      break;
    case "area":
      promptInstructions = `Create a story about a ${geoProblem.shape} that is ${geoProblem.num1} units long and ${geoProblem.num2} units wide.
The student needs to find the area. The answer is ${geoProblem.answer} square units.
Use a scenario like covering a floor with tiles, painting a wall, or planting a garden.
Do NOT show the math equation.`;
      break;
    case "shape_identify":
      promptInstructions = `Create a fun riddle or description about a shape without naming it.
Describe that it has ${geoProblem.answer} sides and ${geoProblem.answer} corners.
The student needs to figure out the number of sides. The answer is ${geoProblem.answer}.
Use clues about where they might see this shape in real life.`;
      break;
  }

  try {
    const prompt = `You are creating a geometry problem for a ${grade === "K" ? "Kindergarten" : `Grade ${grade}`} student.

${promptInstructions}

IMPORTANT RULES:
- Do NOT include any math equations.
- Keep language simple and age-appropriate.
- Make it engaging and fun with a real-world context.
- The student should READ and THINK to find the answer.

Respond in JSON format:
{
  "story": "The engaging story/scenario here...",
  "question": "The question asking for the answer..."
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 250,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        story: parsed.story,
        question: parsed.question,
        problemType: `geometry_${geoProblem.concept}`,
        answer: geoProblem.answer,
        options,
      };
    }
  } catch (error) {
    console.error("AI geometry generation failed, using fallback:", error);
  }

  const fallbackStories: Record<string, string> = {
    sides: `Look at this ${geoProblem.shape}! It's a really cool shape you can find in many places.`,
    corners: `You found a ${geoProblem.shape} shaped cookie cutter in the kitchen!`,
    perimeter: `You want to put a ribbon around a ${geoProblem.shape}. Each side is ${geoProblem.num1} units long.`,
    area: `You're painting a ${geoProblem.shape} that is ${geoProblem.num1} units long and ${geoProblem.num2} units wide.`,
    shape_identify: `This mystery shape has ${geoProblem.answer} sides and ${geoProblem.answer} corners. You can find it everywhere!`,
  };

  const fallbackQuestions: Record<string, string> = {
    sides: `How many sides does a ${geoProblem.shape} have?`,
    corners: `How many corners does a ${geoProblem.shape} have?`,
    perimeter: `What is the total distance around the ${geoProblem.shape}?`,
    area: `What is the area of the ${geoProblem.shape}?`,
    shape_identify: `How many sides does this shape have?`,
  };

  return {
    story: fallbackStories[geoProblem.concept] || `Look at this ${geoProblem.shape}!`,
    question: fallbackQuestions[geoProblem.concept] || `How many sides does it have?`,
    problemType: `geometry_${geoProblem.concept}`,
    answer: geoProblem.answer,
    options,
  };
}

export interface Lesson {
  title: string;
  explanation: string;
  examples: { problem: string; solution: string; explanation: string }[];
  tip: string;
}

export async function generateLesson(
  topicName: string,
  operationType: string,
  grade: string,
  difficulty: string
): Promise<Lesson> {
  const gradeLabel = grade === "K" ? "Kindergarten" : `Grade ${grade}`;
  const difficultyLabel = difficulty === "easy" ? "beginner" : difficulty === "difficult" ? "intermediate" : "advanced";

  try {
    const prompt = `You are a friendly, encouraging math teacher creating a short lesson for a ${gradeLabel} student.

Topic: ${topicName}
Operation: ${operationType}
Difficulty: ${difficultyLabel}

Create a mini-lesson that:
1. Explains the concept in simple, kid-friendly language (2-3 sentences)
2. Shows 2 worked examples with step-by-step explanations
3. Gives a helpful tip or trick to remember

IMPORTANT:
- Use age-appropriate language for ${gradeLabel}
- Be encouraging and fun
- Use real-world examples kids can relate to
- Keep it concise — this is a quick lesson before practice

Respond in JSON format:
{
  "title": "A fun title for the lesson",
  "explanation": "Simple explanation of the concept...",
  "examples": [
    { "problem": "3 + 4 = ?", "solution": "7", "explanation": "Count 3 fingers, then 4 more. You get 7!" },
    { "problem": "5 + 2 = ?", "solution": "7", "explanation": "Start at 5 on the number line, jump 2 forward!" }
  ],
  "tip": "A helpful trick or tip..."
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("AI lesson generation failed, using fallback:", error);
  }

  return {
    title: `Let's Learn ${topicName}!`,
    explanation: `${topicName} is a fun part of math! Let's practice together and you'll get the hang of it in no time.`,
    examples: [
      { problem: "Example coming soon", solution: "Try the exercises!", explanation: "Practice makes perfect!" },
    ],
    tip: "Take your time and think about each question carefully. You've got this!",
  };
}

export async function textToSpeech(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text,
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
