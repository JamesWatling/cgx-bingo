export function randomizeCard(questions: string[]): string[] {
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    return shuffledQuestions.slice(0, 25); // Assuming a 5x5 bingo card
}