async function fetchHistoricalEvents(cycle, region, limit = 5) {
  const cycleParam = cycle ? `&cycle_type=eq.${cycle}` : '';
  const regionParam = region ? `&region=eq.${region}` : '';
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/historical_events?significance=gte.3${cycleParam}${regionParam}&select=*&order=significance.desc&limit=${limit}`,
    { headers }
  );
  const events = await r.json();
  return Array.isArray(events) ? events : [];
}

async function generateHistoricalPredictions(stories, startTime, log) {
  let count = 0;
  for (const story of stories) {
    const elapsed = Date.now() - startTime;
    if (elapsed > 55000) { log.push('   ⏱️ Timeout, parando previsoes'); break; }

    const existing = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?story_id=eq.${story.id}&select=id`,
      { headers }
    ).then(r => r.json()).catch(() => []);
    if (Array.isArray(existing) && existing.length > 0) {
      log.push(`   ⏭️ Story ja tem previsao: ${(story.main_subject || '').slice(0, 20)}`);
      continue;
    }

    const events = await fetchHistoricalEvents(story.cycle, story.region, 4);
    if (events.length === 0) { log.push(`   ⚠️ Sem eventos historicos para ${story.cycle}/${story.region}`); continue; }

    const eventsText = events.map(e =>
      `- ${e.name} (${e.event_date}): ${e.description || ''} Outcome: ${e.outcome || 'N/A'}`
    ).join('\n');

    const prompt = HISTORICAL_PROMPT
      .replace('{story_title}', story.main_subject || story.title || '')
      .replace('{story_summary}', story.summary || '')
      .replace('{cycle}', story.cycle || 'politico')
      .replace('{region}', story.region || 'BR')
      .replace('{historical_events}', eventsText);

    log.push(`   🔮 Gerando previsao historica para: "${(story.main_subject || '').slice(0, 25)}..."`);

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 25000);
      const response = await fetch('https://ollama.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OLLAMA_API_KEY}`,
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [{ role: 'user', content: prompt }],
          format: 'json',
          options: { temperature: 0.3, num_predict: 150 },
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!response.ok) { log.push(`   ❌ Ollama error: ${response.status}`); continue; }

      const data = await response.json();
      const raw = (data.message?.content || '{}').replace(/```json\n?|\n?```/g, '').trim();
      let pred;
      try { pred = JSON.parse(raw); } catch { log.push(`   ❌ JSON parse: ${raw.slice(0, 60)}`); continue; }

      const prob = typeof pred.probability === 'number' ? pred.probability : 0.5;
      const brier = Math.round((1 - prob) ** 2 * 100) / 100;

      await fetch(`${SUPABASE_URL}/rest/v1/predictions`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({
          story_id: story.id,
          title: `Historico: ${story.main_subject || story.title}`.slice(0, 300),
          description: pred.reasoning || null,
          cycle: story.cycle,
          probability: prob,
          historical_analogue: pred.historical_analogue || null,
          reasoning: pred.reasoning || null,
          confidence: pred.confidence || 'medium',
          horizon_days: pred.horizon_days || 60,
          source: 'prophet-historical',
          brier_score: brier,
        }),
      });
      count++;
      log.push(`   ✅ Previsao: ${pred.historical_analogue} (${(prob * 100).toInt()}%)`);
    } catch (e) {
      log.push(`   ❌ Erro: ${e.name}: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 1500));
  }
  return count;
}