import { supabase } from '../../src/db/supabase.js';
/**
 * GET /api/regions
 * Lista regiões hierárquicas
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('name');
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    // Organiza em árvore (parent_id)
    const roots = (data || []).filter((r) => !r.parent_id);
    const children = (data || []).filter((r) => r.parent_id);
    const withChildren = roots.map((root) => ({
        ...root,
        children: children.filter((c) => c.parent_id === root.id),
    }));
    return res.status(200).json({ regions: data || [], tree: withChildren });
}
