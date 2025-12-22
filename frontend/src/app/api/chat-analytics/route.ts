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
        sendEvent(controller, 'status', { step: 'loading-analytics', message: 'Loading analytics...' });

        const analyticsContext = searchAnalytics(message);
        const lowerQuery = message.toLowerCase();

        // Step 2: Generate response based on query
        sendEvent(controller, 'status', { step: 'analyzing', message: 'Analyzing data...' });

        let response: any;

        // Detect query intent and generate appropriate response
        if (lowerQuery.includes('grow') || lowerQuery.includes('trend') || lowerQuery.includes('fastest')) {
          response = generateGrowthResponse(message);
        } else if (lowerQuery.includes('solar') || lowerQuery.includes('energy') || lowerQuery.includes('battery')) {
          response = generateEnergyResponse(message);
        } else if (lowerQuery.includes('cluster') || lowerQuery.includes('type') || lowerQuery.includes('category')) {
          response = generateClusterResponse(message);
        } else if (/\b\d{5}\b/.test(lowerQuery)) { // ZIP code detection
          const zipMatch = lowerQuery.match(/\b(\d{5})\b/);
          const zip = zipMatch ? zipMatch[1] : null;
          response = zip ? generateZipResponse(zip) : generateOverviewResponse(message);
        } else {
          response = generateOverviewResponse(message);
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

function generateGrowthResponse(query: string) {
  const growing = getFastestGrowingClusters(5);

  return {
    message: `Austin's construction landscape is experiencing explosive growth in several sectors:

**Top Growth Leaders:**
${growing.map((g, i) => `${i + 1}. ${g.name}: **+${g.cagr.toFixed(1)}% CAGR** since 2020`).join('\n')}

The demolition boom (+547% CAGR) signals intense urban redevelopment, while major remodels (+343%) indicate existing properties being upgraded. This suggests Austin is both tearing down and building up simultaneously.`,

    stories: [
      {
        id: '1',
        title: '🔥 The Demolition Boom',
        description: `Demolition permits exploded **+547% CAGR** since 2020. Austin is tearing down the old to make way for the new.`,
        selected: false,
        x: 100,
        y: 100
      },
      {
        id: '2',
        title: '🏗️ Major Remodels Surge',
        description: `Major residential remodels up **+343% CAGR**. Homeowners are investing heavily in upgrades and expansions.`,
        selected: false,
        x: 300,
        y: 100
      }
    ]
  };
}

function generateEnergyResponse(query: string) {
  const energy = getEnergyData();
  const solarLeaders = energy.by_zip.slice(0, 3).sort((a, b) => b.solar - a.solar);
  const batteryLeaders = energy.by_zip.slice(0, 3).sort((a, b) => b.battery - a.battery);

  return {
    message: `Austin's energy infrastructure is transforming rapidly:

**Energy Infrastructure Stats:**
- **${energy.total_energy_permits.toLocaleString()}** total energy permits (${energy.energy_percentage}% of all permits)
- **${energy.solar_stats.total_permits.toLocaleString()}** solar installations averaging ${energy.solar_stats.avg_capacity_kw} kW
- **${(energy.by_type.battery || 0).toLocaleString()}** battery systems (4x more than solar!)
- **${(energy.by_type.ev_charger || 0).toLocaleString()}** EV chargers

**Top Solar ZIPs:**
${solarLeaders.map((z, i) => `${i + 1}. ZIP ${z.zip_code}: ${z.solar} installations`).join('\n')}

**Top Battery ZIPs:**
${batteryLeaders.map((z, i) => `${i + 1}. ZIP ${z.zip_code}: ${z.battery} systems`).join('\n')}

Total solar capacity: **${(energy.solar_stats.total_capacity_kw / 1000).toFixed(1)} MW**`,

    stories: [
      {
        id: '1',
        title: '⚡ The Battery Surprise',
        description: `${(energy.by_type.battery || 0).toLocaleString()} battery systems installed - 4x more than solar. ZIP ${batteryLeaders[0].zip_code} leads with ${batteryLeaders[0].battery} systems.`,
        selected: false,
        x: 100,
        y: 100
      },
      {
        id: '2',
        title: '☀️ Solar Installations',
        description: `${energy.solar_stats.total_permits.toLocaleString()} solar permits averaging ${energy.solar_stats.avg_capacity_kw} kW = ${(energy.solar_stats.total_capacity_kw / 1000).toFixed(1)} MW total capacity.`,
        selected: false,
        x: 300,
        y: 100
      }
    ]
  };
}

function generateClusterResponse(query: string) {
  const clusters = getClusters();

  return {
    message: `Our ML clustering identified **8 distinct permit types** from 2.3 million construction permits:

${clusters.map(c => `**${c.name}**: ${c.size.toLocaleString()} permits (${c.percentage.toFixed(1)}%)`).join('\n')}

These clusters reveal Austin's construction priorities: new residential development leads, followed by general repairs and electrical/roofing work.`,

    stories: clusters.slice(0, 3).map((c, i) => ({
      id: String(i + 1),
      title: c.name,
      description: `${c.size.toLocaleString()} permits (${c.percentage.toFixed(1)}% of total). Top keywords: ${c.top_keywords.slice(0, 3).map(k => k.keyword).join(', ')}`,
      selected: false,
      x: 100 + i * 200,
      y: 100
    }))
  };
}

function generateZipResponse(zip: string) {
  const energy = getEnergyData();
  const zipData = energy.by_zip.find(z => z.zip_code === zip);

  if (!zipData) {
    return {
      message: `ZIP ${zip} has limited data in our dataset. Try a major Austin ZIP like 78758, 78744, or 78701.`,
      stories: []
    };
  }

  const insights: string[] = [];
  if (zipData.battery > 500) insights.push(`**Battery hub** with ${zipData.battery} systems`);
  if (zipData.solar > 300) insights.push(`**Solar leader** with ${zipData.solar} installations`);
  if (zipData.ev_charger > 50) insights.push(`${zipData.ev_charger} EV chargers`);

  return {
    message: `**ZIP ${zip}** has ${zipData.total_energy_permits} energy permits:

${insights.join('\n')}

**Breakdown:**
- Solar: ${zipData.solar}
- Battery: ${zipData.battery}
- EV Chargers: ${zipData.ev_charger}
- Generators: ${zipData.generator}`,

    stories: [
      {
        id: '1',
        title: `ZIP ${zip} Energy Profile`,
        description: insights.length > 0 ? insights[0] : `${zipData.total_energy_permits} total energy permits`,
        selected: false,
        x: 100,
        y: 100
      }
    ]
  };
}

function generateOverviewResponse(query: string) {
  const clusters = getClusters();
  const energy = getEnergyData();
  const growing = getFastestGrowingClusters(3);

  return {
    message: `Austin construction insights from 2.3 million permits:

**Key Findings:**
- **8 permit clusters** identified through ML
- **${energy.total_energy_permits.toLocaleString()} energy permits** (${energy.energy_percentage}% of total)
- **Demolition boom**: +547% CAGR growth
- **Battery surprise**: ${(energy.by_type.battery || 0).toLocaleString()} systems (4x more than solar)

**Fastest Growing:**
${growing.map((g, i) => `${i + 1}. ${g.name}: +${g.cagr.toFixed(1)}%`).join('\n')}`,

    stories: [
      {
        id: '1',
        title: '🚀 Austin is Exploding',
        description: 'Demolition permits up 547% CAGR. Urban redevelopment boom is transforming the city.',
        selected: false,
        x: 100,
        y: 100
      },
      {
        id: '2',
        title: '⚡ Energy Infrastructure',
        description: `${energy.total_energy_permits.toLocaleString()} energy permits tracked. Battery systems lead with ${(energy.by_type.battery || 0).toLocaleString()} installations.`,
        selected: false,
        x: 300,
        y: 100
      }
    ]
  };
}
