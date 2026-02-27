import type { GradeLevel, OperationType, MathProblem } from '../types';

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function getGradeDifficulty(grade: GradeLevel): number {
  const difficulties: Record<GradeLevel, number> = {
    'K': 1,
    '1': 2,
    '2': 3,
    '3': 4,
    '4': 5,
    '5': 6,
  };
  return difficulties[grade];
}

export function getAvailableOperations(grade: GradeLevel): OperationType[] {
  switch (grade) {
    case 'K':
      return ['addition'];
    case '1':
      return ['addition', 'subtraction'];
    case '2':
      return ['addition', 'subtraction'];
    case '3':
      return ['addition', 'subtraction', 'multiplication'];
    case '4':
    case '5':
      return ['addition', 'subtraction', 'multiplication', 'division'];
    default:
      return ['addition'];
  }
}

export function generateBasicProblem(
  type: OperationType,
  difficulty: number
): { num1: number; num2: number; answer: number; operator: string } {
  let num1: number, num2: number, answer: number, operator: string;

  switch (type) {
    case 'addition':
      operator = '+';
      num1 = getRandomInt(1, 5 * difficulty);
      num2 = getRandomInt(1, 5 * difficulty);
      answer = num1 + num2;
      break;
    case 'subtraction':
      operator = '-';
      num1 = getRandomInt(3 * difficulty, 10 * difficulty);
      num2 = getRandomInt(1, num1);
      answer = num1 - num2;
      break;
    case 'multiplication':
      operator = '×';
      num1 = getRandomInt(1, 3 + difficulty);
      num2 = getRandomInt(1, 3 + difficulty);
      answer = num1 * num2;
      break;
    case 'division':
      operator = '÷';
      num2 = getRandomInt(1, 3 + difficulty);
      answer = getRandomInt(1, 3 + difficulty);
      num1 = num2 * answer;
      break;
    default:
      throw new Error('Invalid operation type');
  }

  return { num1, num2, answer, operator };
}

export function generateOptions(answer: number): number[] {
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

export function createMathProblem(
  type: OperationType,
  grade: GradeLevel,
  storyTemplate?: { story: string; question: string }
): MathProblem {
  const difficulty = getGradeDifficulty(grade);
  const { num1, num2, answer, operator } = generateBasicProblem(type, difficulty);
  const options = generateOptions(answer);

  const defaultStory = `You have ${num1} items. ${type === 'addition' ? `You get ${num2} more.` : type === 'subtraction' ? `You give away ${num2}.` : type === 'multiplication' ? `Each item has ${num2} parts.` : `You share them equally among ${num2} friends.`}`;
  const defaultQuestion = `How many do you have ${type === 'division' ? 'per friend' : 'now'}?`;

  return {
    id: Math.random().toString(36).substring(7),
    story: storyTemplate?.story?.replace('{num1}', String(num1)).replace('{num2}', String(num2)) || defaultStory,
    question: storyTemplate?.question || defaultQuestion,
    num1,
    num2,
    operator,
    answer,
    options,
  };
}
