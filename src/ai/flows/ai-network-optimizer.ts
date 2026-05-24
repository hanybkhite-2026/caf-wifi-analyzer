'use server';
/**
 * @fileOverview An AI-powered tool that analyzes CAF-WIFI network scan patterns
 * and provides actionable, prioritized configuration recommendations to optimize
 * network performance and reduce interference.
 *
 * - aiNetworkOptimizer - A function that handles the network optimization process.
 * - AiNetworkOptimizerInput - The input type for the aiNetworkOptimizer function.
 * - AiNetworkOptimizerOutput - The return type for the aiNetworkOptimizer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NetworkScanSchema = z.object({
  ssid: z.string().describe('The SSID (Network Name) of the CAF-WIFI network.'),
  signalStrength: z.number().describe('The signal strength in dBm (e.g., -45).'),
  channel: z.number().describe('The WiFi channel the network is operating on.'),
  clientsConnected: z.number().describe('The number of clients currently connected to this network.'),
  networkType: z.string().describe('The type of network (e.g., Main, Guest, IoT).'),
  frequencyBand: z.string().describe('The frequency band of the network (e.g., 2.4GHz, 5GHz, 6GHz).'),
  interferenceScore: z.number().describe('A score indicating the level of interference (0-10, higher is worse).'),
  location: z.string().describe('The physical location where this scan was performed (e.g., "Floor 1, Office A").'),
});

const RecommendationSchema = z.object({
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the recommendation.'),
  category: z.string().describe('The category of the recommendation (e.g., Channel Optimization, AP Placement, Client Load Balancing, Security, Coverage).'),
  description: z.string().describe('A detailed explanation of the identified issue and the recommended solution.'),
  actionSteps: z.array(z.string()).describe('A list of step-by-step actions to implement the recommendation.'),
});

const AiNetworkOptimizerInputSchema = z.object({
  networkScans: z.array(NetworkScanSchema).describe('An array of recent CAF-WIFI network scan data.'),
});
export type AiNetworkOptimizerInput = z.infer<typeof AiNetworkOptimizerInputSchema>;

const AiNetworkOptimizerOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema).describe('A prioritized list of configuration recommendations to optimize network performance and reduce interference.'),
  summary: z.string().describe('A summary of the overall network health and key findings.'),
});
export type AiNetworkOptimizerOutput = z.infer<typeof AiNetworkOptimizerOutputSchema>;

export async function aiNetworkOptimizer(input: AiNetworkOptimizerInput): Promise<AiNetworkOptimizerOutput> {
  return aiNetworkOptimizerFlow(input);
}

const aiNetworkOptimizerPrompt = ai.definePrompt({
  name: 'aiNetworkOptimizerPrompt',
  input: { schema: AiNetworkOptimizerInputSchema },
  output: { schema: AiNetworkOptimizerOutputSchema },
  prompt: `You are an expert CAF-WIFI network engineer and optimizer. Your task is to analyze the provided network scan data and identify potential issues related to signal strength, interference, client distribution, and overall performance. Based on your analysis, provide actionable, prioritized configuration recommendations to optimize the CAF-WIFI network performance and reduce interference.

Here is the CAF-WIFI network scan data:

{{#each networkScans}}
Network Name (SSID): {{{ssid}}}
Signal Strength: {{{signalStrength}}} dBm
WiFi Channel: {{{channel}}}
Clients Connected: {{{clientsConnected}}}
Network Type: {{{networkType}}}
Frequency Band: {{{frequencyBand}}}
Interference Score: {{{interferenceScore}}} (0-10, higher is worse)
Location: {{{location}}}
---
{{/each}}

Analyze this data thoroughly. Identify patterns, anomalies, and areas for improvement. Then, generate a prioritized list of specific recommendations in the JSON format specified by the output schema. Each recommendation should include a priority, a category, a detailed description of the issue and solution, and clear action steps. Also, provide a concise overall summary of the network's health and your key findings.`,
});

const aiNetworkOptimizerFlow = ai.defineFlow(
  {
    name: 'aiNetworkOptimizerFlow',
    inputSchema: AiNetworkOptimizerInputSchema,
    outputSchema: AiNetworkOptimizerOutputSchema,
  },
  async (input) => {
    const { output } = await aiNetworkOptimizerPrompt(input);
    return output!;
  }
);
