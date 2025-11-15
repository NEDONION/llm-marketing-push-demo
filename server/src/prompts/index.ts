// src/prompts/index.ts
import { buildPushSystemPrompt } from './push';
import { buildEmailSystemPrompt } from './email';
import { Channel, Constraints, Locale } from '../types';

export function getSystemPromptByChannel(
    channel: Channel,
    locale: Locale,
    maxLen: number,
    constraints: Constraints
) {
    if (channel === 'PUSH') {
        return buildPushSystemPrompt(locale, maxLen, constraints);
    }
    if (channel === 'EMAIL') {
        return buildEmailSystemPrompt(locale, maxLen, constraints);
    }
    throw new Error(`Unsupported channel: ${channel}`);
}
