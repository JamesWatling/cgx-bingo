export function validateParticipants(name: string, participantsList: string[]): boolean {
    const trimmedName = name.trim();
    return trimmedName.length > 0 && participantsList.includes(trimmedName);
}