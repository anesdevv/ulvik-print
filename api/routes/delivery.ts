import { Router, Response } from 'express';
import { supabase, isPlaceholder } from '../lib/supabase.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/requireAdmin.js';

const router = Router();

// In-memory mock delivery pricing fallback dataset
let mockDeliveryPrices: Array<{ wilaya: string; home_fee: number; desk_fee: number }> = [
  { wilaya: '01 - Adrar', home_fee: 1000, desk_fee: 700 },
  { wilaya: '02 - Chlef', home_fee: 700, desk_fee: 400 },
  { wilaya: '03 - Laghouat', home_fee: 800, desk_fee: 500 },
  { wilaya: '04 - Oum El Bouaghi', home_fee: 700, desk_fee: 400 },
  { wilaya: '05 - Batna', home_fee: 700, desk_fee: 400 },
  { wilaya: '06 - Béjaïa', home_fee: 700, desk_fee: 400 },
  { wilaya: '07 - Biskra', home_fee: 800, desk_fee: 500 },
  { wilaya: '08 - Béchar', home_fee: 900, desk_fee: 600 },
  { wilaya: '09 - Blida', home_fee: 500, desk_fee: 200 },
  { wilaya: '10 - Bouira', home_fee: 600, desk_fee: 300 },
  { wilaya: '11 - Tamanrasset', home_fee: 1200, desk_fee: 900 },
  { wilaya: '12 - Tébessa', home_fee: 800, desk_fee: 500 },
  { wilaya: '13 - Tlemcen', home_fee: 800, desk_fee: 500 },
  { wilaya: '14 - Tiaret', home_fee: 700, desk_fee: 400 },
  { wilaya: '15 - Tizi Ouzou', home_fee: 600, desk_fee: 300 },
  { wilaya: '16 - Alger', home_fee: 400, desk_fee: 100 },
  { wilaya: '17 - Djelfa', home_fee: 700, desk_fee: 400 },
  { wilaya: '18 - Jijel', home_fee: 700, desk_fee: 400 },
  { wilaya: '19 - Sétif', home_fee: 700, desk_fee: 400 },
  { wilaya: '20 - Saïda', home_fee: 800, desk_fee: 500 },
  { wilaya: '21 - Skikda', home_fee: 700, desk_fee: 400 },
  { wilaya: '22 - Sidi Bel Abbès', home_fee: 800, desk_fee: 500 },
  { wilaya: '23 - Annaba', home_fee: 700, desk_fee: 400 },
  { wilaya: '24 - Guelma', home_fee: 700, desk_fee: 400 },
  { wilaya: '25 - Constantine', home_fee: 700, desk_fee: 400 },
  { wilaya: '26 - Médéa', home_fee: 600, desk_fee: 300 },
  { wilaya: '27 - Mostaganem', home_fee: 700, desk_fee: 400 },
  { wilaya: '28 - M\'Sila', home_fee: 700, desk_fee: 400 },
  { wilaya: '29 - Mascara', home_fee: 800, desk_fee: 500 },
  { wilaya: '30 - Ouargla', home_fee: 900, desk_fee: 600 },
  { wilaya: '31 - Oran', home_fee: 700, desk_fee: 400 },
  { wilaya: '32 - El Bayadh', home_fee: 900, desk_fee: 600 },
  { wilaya: '33 - Illizi', home_fee: 1200, desk_fee: 900 },
  { wilaya: '34 - Bordj Bou Arréridj', home_fee: 700, desk_fee: 400 },
  { wilaya: '35 - Boumerdès', home_fee: 500, desk_fee: 200 },
  { wilaya: '36 - El Tarf', home_fee: 800, desk_fee: 500 },
  { wilaya: '37 - Tindouf', home_fee: 1200, desk_fee: 900 },
  { wilaya: '38 - Tissemsilt', home_fee: 700, desk_fee: 400 },
  { wilaya: '39 - El Oued', home_fee: 800, desk_fee: 500 },
  { wilaya: '40 - Khenchela', home_fee: 800, desk_fee: 500 },
  { wilaya: '41 - Souk Ahras', home_fee: 800, desk_fee: 500 },
  { wilaya: '42 - Tipaza', home_fee: 500, desk_fee: 200 },
  { wilaya: '43 - Mila', home_fee: 700, desk_fee: 400 },
  { wilaya: '44 - Aïn Defla', home_fee: 700, desk_fee: 400 },
  { wilaya: '45 - Naâma', home_fee: 900, desk_fee: 600 },
  { wilaya: '46 - Aïn Témouchent', home_fee: 800, desk_fee: 500 },
  { wilaya: '47 - Ghardaïa', home_fee: 800, desk_fee: 500 },
  { wilaya: '48 - Relizane', home_fee: 700, desk_fee: 400 },
  { wilaya: '49 - Timimoun', home_fee: 1000, desk_fee: 700 },
  { wilaya: '50 - Bordj Badji Mokhtar', home_fee: 1200, desk_fee: 900 },
  { wilaya: '51 - Ouled Djellal', home_fee: 800, desk_fee: 500 },
  { wilaya: '52 - Béni Abbès', home_fee: 1000, desk_fee: 700 },
  { wilaya: '53 - In Salah', home_fee: 1100, desk_fee: 800 },
  { wilaya: '54 - In Guezzam', home_fee: 1200, desk_fee: 900 },
  { wilaya: '55 - Touggourt', home_fee: 900, desk_fee: 600 },
  { wilaya: '56 - Djanet', home_fee: 1200, desk_fee: 900 },
  { wilaya: '57 - El M\'Ghair', home_fee: 950, desk_fee: 650 },
  { wilaya: '58 - El Meniaa', home_fee: 950, desk_fee: 650 }
];

// GET /api/delivery - Public (Fetch all wilaya fees)
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (isPlaceholder) {
      res.json(mockDeliveryPrices);
      return;
    }

    const { data, error } = await supabase
      .from('delivery_prices')
      .select('*')
      .order('wilaya', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/delivery - Admin only (Bulk upsert wilaya fees)
// Body should be an array of { wilaya: string, home_fee: number, desk_fee: number }
router.put('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const prices = req.body;

    if (!Array.isArray(prices)) {
      res.status(400).json({ error: 'Body must be an array of { wilaya, home_fee, desk_fee }' });
      return;
    }

    // Validate that each item has a wilaya, home_fee, and desk_fee
    for (const item of prices) {
      if (!item.wilaya || item.home_fee === undefined || item.desk_fee === undefined) {
        res.status(400).json({ error: 'Each pricing item must contain a wilaya name, home_fee, and desk_fee' });
        return;
      }
    }

    if (isPlaceholder) {
      // Apply updates in-memory
      for (const item of prices) {
        const idx = mockDeliveryPrices.findIndex(p => p.wilaya === item.wilaya);
        if (idx !== -1) {
          mockDeliveryPrices[idx].home_fee = Number(item.home_fee);
          mockDeliveryPrices[idx].desk_fee = Number(item.desk_fee);
        } else {
          mockDeliveryPrices.push({
            wilaya: item.wilaya,
            home_fee: Number(item.home_fee),
            desk_fee: Number(item.desk_fee)
          });
        }
      }
      // Sort
      mockDeliveryPrices.sort((a, b) => a.wilaya.localeCompare(b.wilaya));
      res.json(mockDeliveryPrices);
      return;
    }

    const { data, error } = await supabase
      .from('delivery_prices')
      .upsert(prices)
      .select();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
