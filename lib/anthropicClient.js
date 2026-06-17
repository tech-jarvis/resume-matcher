import Anthropic from "@anthropic-ai/sdk";
import { assertAnthropicConfigured } from "@/lib/apiErrors";

export const ANTHROPIC_MODEL = "claude-sonnet-4-6";

export function createAnthropicClient() {
  const apiKey = assertAnthropicConfigured();
  return new Anthropic({ apiKey });
}
