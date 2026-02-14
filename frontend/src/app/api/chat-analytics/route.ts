import { ChatResponseSchema } from '@/lib/chat-schema';
import { searchAnalytics, getClusters, getEnergyData, getFastestGrowingClusters } from '@/lib/analytics-data';

export const maxDuration = 60;

// Helper to send SSE events
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

/**
 * Analytics-only chat endpoint (no LLM required)
 * Uses pre-computed analytics to generate story responses
 *
 * MODEL: Analytics Engine (pre-computed data, no LLM required)
 */
export async function POST(req: Request) {
  const { message } = await req.json();

  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Load analytics
        sendEvent(controller, 'status', { step: 'loading-analytics', message: '🤖 Analytics Engine (Supabase)' });

        const analyticsContext = await searchAnalytics(message);
        const lowerQuery = message.toLowerCase();

        // Step 2: Generate response based on query
        sendEvent(controller, 'status', { step: 'analyzing', message: 'Processing Supabase data...' });

        let response: any;

        // Detect query intent and generate appropriate response (order matters - most specific first)

        // Check for ZIP codes first
        if (/\b\d{5}\b/.test(lowerQuery)) {
          const zipMatch = lowerQuery.match(/\b(\d{5})\b/);
          const zip = zipMatch ? zipMatch[1] : null;
          response = zip ? await generateZipResponse(zip) : await generateOverviewResponse(message);
        }
        // Pools / luxury (check before neighborhoods to avoid false matches)
        else if (lowerQuery.includes('pool') || lowerQuery.includes('luxury') || lowerQuery.includes('wealthy') || lowerQuery.includes('rich')) {
          response = await generatePoolsResponse(message);
        }
        // Changes over time (2020, since, changed)
        else if (lowerQuery.includes('2020') || lowerQuery.includes('2021') || lowerQuery.includes('since') || lowerQuery.includes('changed') || lowerQuery.includes('covid') || lowerQuery.includes('pandemic')) {
          response = await generateChangeResponse(message);
        }
        // Growth and trends
        else if (lowerQuery.includes('grow') || lowerQuery.includes('trend') || lowerQuery.includes('fastest') || lowerQuery.includes('boom') || lowerQuery.includes('increas') || lowerQuery.includes('explosion')) {
          response = await generateGrowthResponse(message);
        }
        // Energy-related queries
        else if (lowerQuery.includes('solar') || lowerQuery.includes('battery') || lowerQuery.includes('ev charger') || lowerQuery.includes('generator') || lowerQuery.includes('panel')) {
          response = await generateEnergyResponse(message);
        }
        // Clusters and types
        else if (lowerQuery.includes('cluster') || lowerQuery.includes('type') || lowerQuery.includes('category') || lowerQuery.includes('kind')) {
          response = await generateClusterResponse(message);
        }
        // New construction / neighborhoods (more generic, check later)
        else if (lowerQuery.includes('new construction') || lowerQuery.includes('building') || lowerQuery.includes('neighborhood') || lowerQuery.includes('where') || lowerQuery.includes('area')) {
          response = await generateNewConstructionResponse(message);
        }
        // Default overview
        else {
          response = await generateOverviewResponse(message);
        }

        // Send final response
        sendEvent(controller, 'response', response);
        sendEvent(controller, 'done', {});

      } catch (error) {
        console.error('Chat API error:', error);
        sendEvent(controller, 'error', { message: 'Failed to generate response' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function generateGrowthResponse(query: string) {
  const clusters = await getClusters();
  const top5 = clusters.sort((a, b) => b.size - a.size).slice(0, 5);

  return {
    message: `**Largest Permit Categories:**

${top5.map((c, i) => `${i + 1}. ${c.name}: **${c.size.toLocaleString()} permits** (${c.percentage.toFixed(1)}%)`).join('\n')}

Growth rate data requires time-series analysis — current data shows category distribution.`,

    storyBlock: {
      id: `growth-${Date.now()}`,
      headline: 'Permit Category Leaders',
      insight: `**${top5[0].name}** leads with **${top5[0].size.toLocaleString()} permits** (${top5[0].percentage.toFixed(1)}% of total).`,
      dataPoint: { label: 'permits', value: top5[0].size.toLocaleString() },
      whyStoryWorthy: 'turning-point',
      evidence: top5.slice(0, 2).map(c => ({
        stat: `${c.name}: ${c.size.toLocaleString()} permits (${c.percentage.toFixed(1)}%)`,
        source: 'ML clustering pipeline'
      })),
      confidence: 'high',
      chartData: {
        type: 'bar' as const,
        title: 'Top Permit Categories',
        data: top5.map(c => ({ name: c.name, value: c.size }))
      }
    }
  };
}

async function generateEnergyResponse(query: string) {
  const energy = await getEnergyData();
  const solarLeaders = energy.by_zip.slice(0, 3).sort((a, b) => b.solar - a.solar);
  const batteryLeaders = energy.by_zip.slice(0, 3).sort((a, b) => b.battery - a.battery);

  // Calculate actual ratio: solar / battery
  const solarCount = energy.solar_stats.total_permits || 0;
  const batteryCount = energy.by_type.battery || 0;
  const ratio = batteryCount > 0 ? Math.round(solarCount / batteryCount) : 0;

  return {
    message: `**Energy Infrastructure:**
- **${solarCount.toLocaleString()} solar** vs only ${batteryCount.toLocaleString()} batteries (${ratio}:1 gap!)
- **${(energy.by_type.ev_charger || 0).toLocaleString()} EV chargers**
- **${(energy.by_type.generator || 0).toLocaleString()} generators** (grid backup)
- Total: **${energy.total_energy_permits.toLocaleString()} permits** (${energy.energy_percentage}%)

**Top Solar ZIP:** ${solarLeaders[0].zip_code} (${solarLeaders[0].solar} installations)
**Top Battery ZIP:** ${batteryLeaders[0].zip_code} (${batteryLeaders[0].battery} systems)`,

    storyBlock: {
      id: `energy-${Date.now()}`,
      headline: 'Solar vs Storage Gap',
      insight: `**${solarCount.toLocaleString()} solar installations** but only **${batteryCount.toLocaleString()} battery systems** — a ${ratio}:1 ratio.`,
      dataPoint: { label: 'solar:battery ratio', value: `${ratio}:1` },
      whyStoryWorthy: 'paradox',
      evidence: [
        { stat: `${solarCount.toLocaleString()} solar vs ${batteryCount.toLocaleString()} batteries (${ratio}:1 storage gap)`, source: 'Energy infrastructure tracker' },
        { stat: `${(energy.by_type.generator || 0).toLocaleString()} generators installed`, source: 'Permit analysis' }
      ],
      confidence: 'high',
      geoData: {
        type: 'zip',
        zips: solarLeaders.map(z => z.zip_code),
        signal: 'solar'
      }
    }
  };
}

async function generateClusterResponse(query: string) {
  const clusters = await getClusters();
  const topCluster = clusters[0];

  return {
    message: `**8 Permit Types (ML Clustering):**

${clusters.map(c => `**${c.name}**: ${c.size.toLocaleString()} (${c.percentage.toFixed(1)}%)`).join('\n')}`,

    storyBlock: {
      id: `cluster-${Date.now()}`,
      headline: topCluster.name,
      insight: `**${topCluster.size.toLocaleString()} permits** (${topCluster.percentage.toFixed(1)}% of total) classified as ${topCluster.name}. Top signals: **${topCluster.top_keywords.slice(0, 3).map(k => k.keyword).join(', ')}**.`,
      dataPoint: { label: 'permits', value: topCluster.size.toLocaleString() },
      whyStoryWorthy: 'outlier',
      evidence: [
        { stat: `8 clusters identified via K-Means`, source: 'ML clustering pipeline' },
        { stat: `Top keywords: ${topCluster.top_keywords.slice(0, 5).map(k => k.keyword).join(', ')}`, source: 'Keyword prevalence analysis' }
      ],
      confidence: 'high'
    }
  };
}

async function generateZipResponse(zip: string) {
  const energy = await getEnergyData();
  const zipData = energy.by_zip.find(z => z.zip_code === zip);

  if (!zipData) {
    return {
      message: `ZIP ${zip} has limited data in our dataset. Try a major Austin ZIP like 78758, 78744, or 78701.`,
      storyBlock: null
    };
  }

  const insights: string[] = [];
  let specialization = 'energy permits';
  if (zipData.battery > 500) {
    insights.push(`**Battery hub** with ${zipData.battery} systems`);
    specialization = 'battery hub';
  }
  if (zipData.solar > 300) {
    insights.push(`**Solar leader** with ${zipData.solar} installations`);
    specialization = 'solar leader';
  }
  if (zipData.ev_charger > 50) insights.push(`${zipData.ev_charger} EV chargers`);

  return {
    message: `**ZIP ${zip}** has ${zipData.total_energy_permits} energy permits:

${insights.join('\n')}

**Breakdown:**
- Solar: ${zipData.solar}
- Battery: ${zipData.battery}
- EV Chargers: ${zipData.ev_charger}
- Generators: ${zipData.generator}`,

    storyBlock: {
      id: `zip-${zip}-${Date.now()}`,
      headline: `ZIP ${zip}: ${specialization}`,
      insight: insights.length > 0 ? insights[0] : `**${zipData.total_energy_permits} energy permits** tracked in this area.`,
      dataPoint: { label: 'energy permits', value: zipData.total_energy_permits.toString() },
      whyStoryWorthy: 'district-disparity',
      evidence: [
        { stat: `Solar: ${zipData.solar}, Battery: ${zipData.battery}, EV: ${zipData.ev_charger}`, source: 'ZIP-level energy tracker' }
      ],
      confidence: 'high',
      geoData: {
        type: 'zip',
        zips: [zip],
        signal: zipData.battery > zipData.solar ? 'battery' : 'solar'
      }
    }
  };
}

async function generateNewConstructionResponse(query: string) {
  const clusters = await getClusters();
  const newConstruction = clusters.find(c => c.name.toLowerCase().includes('new residential'));

  if (!newConstruction) {
    return await generateOverviewResponse(query);
  }

  return {
    message: `**New residential construction** is the largest permit category in Austin:

**New Residential Construction:**
- **${newConstruction.size.toLocaleString()} permits** (${newConstruction.percentage.toFixed(1)}% of total)
- Top signals: **${newConstruction.top_keywords.slice(0, 5).map(k => k.keyword).join(', ')}**

This cluster represents entirely new homes being built across Austin.`,

    storyBlock: {
      id: `new-construction-${Date.now()}`,
      headline: 'New Construction Boom',
      insight: `**${newConstruction.size.toLocaleString()} new residential permits** — the largest category at ${newConstruction.percentage.toFixed(1)}% of all construction activity in Austin.`,
      dataPoint: { label: 'new residential permits', value: newConstruction.size.toLocaleString() },
      whyStoryWorthy: 'turning-point',
      evidence: [
        { stat: `${newConstruction.size.toLocaleString()} permits (${newConstruction.percentage.toFixed(1)}% of total)`, source: 'ML clustering' }
      ],
      confidence: 'high'
    }
  };
}

async function generatePoolsResponse(query: string) {
  const energy = await getEnergyData();
  // Pools aren't tracked separately, but we can talk about luxury indicators
  const topZips = energy.by_zip.slice(0, 5).sort((a, b) => b.total_energy_permits - a.total_energy_permits);

  return {
    message: `While pool permits aren't tracked separately in our dataset, we can identify **luxury neighborhoods** through high-value energy infrastructure:

**Top Energy Investment ZIPs:**
${topZips.map((z, i) => `${i + 1}. ZIP ${z.zip_code}: ${z.total_energy_permits} energy permits (Solar: ${z.solar}, Battery: ${z.battery})`).join('\n')}

These areas show higher investment in solar, batteries, and generators - indicators of wealth and property value.`,

    storyBlock: {
      id: `luxury-${Date.now()}`,
      headline: '💎 Luxury Energy Investment',
      insight: `ZIP ${topZips[0].zip_code} leads with **${topZips[0].total_energy_permits} energy permits** including ${topZips[0].solar} solar and ${topZips[0].battery} battery systems - signs of high-value properties.`,
      dataPoint: { label: 'energy permits', value: topZips[0].total_energy_permits.toString() },
      whyStoryWorthy: 'equity-gap',
      evidence: [
        { stat: `ZIP ${topZips[0].zip_code}: ${topZips[0].total_energy_permits} total energy permits`, source: 'ZIP-level aggregation' },
        { stat: `Top 5 ZIPs account for significant energy infrastructure`, source: 'Energy tracker' }
      ],
      confidence: 'medium',
      geoData: {
        type: 'zip',
        zips: topZips.map(z => z.zip_code),
        signal: 'all'
      }
    }
  };
}

async function generateChangeResponse(query: string) {
  const clusters = await getClusters();
  const energy = await getEnergyData();
  const top5 = clusters.sort((a, b) => b.size - a.size).slice(0, 5);

  return {
    message: `**Austin Permit Landscape (2000-2026):**

${top5.map((c, i) => `${i + 1}. **${c.name}**: ${c.size.toLocaleString()} permits (${c.percentage.toFixed(1)}%)`).join('\n')}

**Energy shift:** ${(energy.by_type.generator || 0).toLocaleString()} generators installed — grid backup demand surged after Winter Storm Uri (2021).`,

    storyBlock: {
      id: `change-${Date.now()}`,
      headline: 'Post-Storm Shift',
      insight: `Winter Storm Uri (2021) reshaped Austin's energy priorities. **${(energy.by_type.generator || 0).toLocaleString()} generators** now installed across the city — residents invested heavily in grid independence.`,
      dataPoint: { label: 'generators', value: (energy.by_type.generator || 0).toLocaleString() },
      whyStoryWorthy: 'post-freeze-shift',
      evidence: [
        { stat: `${(energy.by_type.generator || 0).toLocaleString()} generator permits`, source: 'Energy infrastructure tracker' },
        { stat: `${energy.solar_stats.total_permits.toLocaleString()} solar installations`, source: 'Energy infrastructure tracker' }
      ],
      confidence: 'high',
      chartData: {
        type: 'bar' as const,
        title: 'Top Permit Categories',
        data: top5.map(c => ({ name: c.name.slice(0, 25), value: c.size }))
      }
    }
  };
}

async function generateOverviewResponse(query: string) {
  const clusters = await getClusters();
  const energy = await getEnergyData();

  const totalPermits = clusters.reduce((sum, c) => sum + c.size, 0);
  const solarCount = energy.solar_stats.total_permits || 0;
  const batteryCount = energy.by_type.battery || 0;
  const generatorCount = energy.by_type.generator || 0;
  const ratio = batteryCount > 0 ? Math.round(solarCount / batteryCount) : 0;
  const clusterCount = clusters.length;
  const topCategories = clusters.sort((a, b) => b.size - a.size).slice(0, 3);

  return {
    message: `**Austin Permit Overview (${totalPermits.toLocaleString()} permits)**

- **${clusterCount} categories** (ML-classified)
- **${solarCount.toLocaleString()} solar** vs **${batteryCount.toLocaleString()} batteries** (${ratio}:1 ratio)
- **${generatorCount.toLocaleString()} generators**

Top categories: ${topCategories.map(c => c.name).join(', ')}`,

    storyBlock: {
      id: `overview-${Date.now()}`,
      headline: 'Solar vs Storage Gap',
      insight: `**${solarCount.toLocaleString()} solar installations** but only **${batteryCount.toLocaleString()} battery systems** — a ${ratio}:1 ratio. **${generatorCount.toLocaleString()} generators** also installed across the city.`,
      dataPoint: { label: 'solar:battery ratio', value: `${ratio}:1` },
      whyStoryWorthy: 'turning-point',
      evidence: [
        { stat: `${clusterCount} categories via K-Means clustering`, source: 'ML pipeline' },
        { stat: `${solarCount.toLocaleString()} solar vs ${batteryCount.toLocaleString()} batteries`, source: 'Energy infrastructure tracker' },
        { stat: `${generatorCount.toLocaleString()} generators installed`, source: 'Permit analysis' }
      ],
      confidence: 'high',
      chartData: {
        type: 'bar' as const,
        title: 'Top Permit Categories',
        data: topCategories.map(c => ({ name: c.name.slice(0, 20), value: c.size }))
      }
    }
  };
}
