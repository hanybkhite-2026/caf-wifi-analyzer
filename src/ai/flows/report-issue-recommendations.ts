'use server';
/**
 * @fileOverview A Genkit flow that analyzes a CAF-WIFI network scan report
 * to provide a summary of identified issues and actionable recommendations.
 *
 * - reportIssueRecommendations - A function that triggers the AI analysis.
 * - ReportIssueRecommendationsInput - The input type for the function.
 * - ReportIssueRecommendationsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const ReportIssueRecommendationsInputSchema = z.object({
  location: z.string().describe('The location where the scan was performed.'),
  networksFound: z.number().describe('The total number of networks found during the scan.'),
  cafAps: z.number().describe('The number of CAF-WIFI access points detected.'),
  avgSignal: z.number().describe('The average signal strength across all detected networks (dBm).'),
  identifiedIssues: z.array(z.string()).describe('A list of raw identified issues during the network scan, e.g., "High interference on 2.4GHz", "Low signal for CAF-GUEST".'),
  scanDetails: z.array(z.object({
    ssid: z.string().describe('Network Name (SSID)'),
    networkType: z.enum(['Main', 'Guest', 'IoT', 'Admin', 'Backup', '2G', '5G']).describe('Type or band of the CAF network'),
    signalStrength: z.number().describe('Signal Strength in dBm (e.g., -45 is good, -70 is poor)'),
    wifiChannel: z.number().describe('WiFi Channel'),
    connectedClients: z.number().describe('Number of Connected Clients'),
  })).describe('Detailed information about each scanned CAF network.'),
});
export type ReportIssueRecommendationsInput = z.infer<typeof ReportIssueRecommendationsInputSchema>;

// Output Schema
const ReportIssueRecommendationsOutputSchema = z.object({
  issueSummary: z.string().describe('A concise summary of the identified network issues. This should be a paragraph or two explaining the overall health and specific problems.'),
  recommendations: z.array(z.string()).describe('A list of clear, actionable recommendations to resolve the network problems. Each recommendation should be a separate item in the array.'),
});
export type ReportIssueRecommendationsOutput = z.infer<typeof ReportIssueRecommendationsOutputSchema>;

// Prompt definition
const reportIssueRecommendationsPrompt = ai.definePrompt({
  name: 'reportIssueRecommendationsPrompt',
  input: {schema: ReportIssueRecommendationsInputSchema},
  output: {schema: ReportIssueRecommendationsOutputSchema},
  prompt: `You are an expert CAF-WIFI network analyst. Your task is to review a network scan report, identify key issues, and provide clear, actionable recommendations for resolving them.

Analyze the following CAF-WIFI network scan report:

Location: {{{location}}}

Summary Statistics:
- Total Networks Found: {{{networksFound}}}
- CAF Access Points Detected: {{{cafAps}}}
- Average Signal Strength: {{{avgSignal}}} dBm (Note: -30 dBm is excellent, -67 dBm is reliable, -70 dBm is not reliable, -80 dBm is poor/unusable)

Raw Identified Issues (if any explicit issues were flagged during the scan):
{{#if identifiedIssues}}
{{#each identifiedIssues}}
- {{{this}}}
{{/each}}
{{else}}
(No explicit raw issues were flagged, analyze scan details for implicit problems.)
{{/if}}

Detailed Scan Data for CAF Networks:
{{#if scanDetails}}
{{#each scanDetails}}
- SSID: {{{ssid}}} (Type: {{{networkType}}}), Signal: {{{signalStrength}}} dBm, Channel: {{{wifiChannel}}}, Connected Clients: {{{connectedClients}}}
{{/each}}
{{else}}
(No detailed scan data available for CAF networks.)
{{/if}}

Based on this information, first provide a concise summary of the overall network health and any critical or recurring issues. Then, list specific, actionable recommendations to improve the network performance and reliability.
`,
});

// Flow definition
const reportIssueRecommendationsFlow = ai.defineFlow(
  {
    name: 'reportIssueRecommendationsFlow',
    inputSchema: ReportIssueRecommendationsInputSchema,
    outputSchema: ReportIssueRecommendationsOutputSchema,
  },
  async (input) => {
    const {output} = await reportIssueRecommendationsPrompt(input);
    if (!output) {
      throw new Error('Failed to generate issue summary and recommendations.');
    }
    return output;
  }
);

// Wrapper function for external calls
export async function reportIssueRecommendations(input: ReportIssueRecommendationsInput): Promise<ReportIssueRecommendationsOutput> {
  return reportIssueRecommendationsFlow(input);
}
