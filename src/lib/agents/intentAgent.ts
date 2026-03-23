import { SearchCriteria } from '../types';

/**
 * Intent Agent
 * Converts user input (form or natural language) into structured search criteria
 */
export class IntentAgent {
  static async processInput(input: {
    from: string;
    to: string;
    date: string;
    class: string;
    quota: string;
    berthPreference: string;
    tatkalTime?: string;
    passengerCount: number;
  }): Promise<SearchCriteria> {
    // Validate and normalize input
    const criteria: SearchCriteria = {
      from: input.from.toUpperCase(),
      to: input.to.toUpperCase(),
      date: input.date,
      class: input.class || 'AC_3',
      quota: input.quota || 'GENERAL',
      berthPreference: input.berthPreference || 'NO_PREFERENCE',
      tatkalTime: input.tatkalTime,
      passengerCount: Math.max(1, Math.min(6, input.passengerCount || 1)),
    };

    // Add logging
    console.log('[Intent Agent] Processing criteria:', criteria);

    return criteria;
  }

  static parseNaturalLanguage(text: string): Partial<SearchCriteria> {
    // Simple NLP parsing for natural language input
    const result: Partial<SearchCriteria> = {};

    // Extract train details from text
    const dateMatch = text.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{4})/);
    if (dateMatch) result.date = dateMatch[0];

    const classMatch = text.match(/(sleeper|ac2|ac3)/i);
    if (classMatch) result.class = classMatch[1].toUpperCase();

    const berthMatch = text.match(/(lower|middle|upper|side)\s*(?:berth|bunk)?/i);
    if (berthMatch) result.berthPreference = berthMatch[1].toUpperCase();

    return result;
  }
}
