import { Router, Response } from 'express';
import { supabase, isPlaceholder } from '../lib/supabase.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/requireAdmin.js';

const router = Router();

// In-memory mock delivery pricing fallback dataset
let mockDeliveryPrices: Array<{ wilaya: string; fee: number }> = [
  { wilaya: '01 - Adrar', fee: 1000 },
  { wilaya: '02 - Chlef', fee: 700 },
  { wilaya: '03 - Laghouat', fee: 800 },
  { wilaya: '04 - Oum El Bouaghi', fee: 700 },
  { wilaya: '05 - Batna', fee: 700 },
  { wilaya: '06 - Béjaïa', fee: 700 },
  { wilaya: '07 - Biskra', fee: 800 },
  { wilaya: '08 - Béchar', fee: 900 },
  { wilaya: '09 - Blida', fee: 500 },
  { wilaya: '10 - Bouira', fee: 600 },
  { wilaya: '11 - Tamanrasset', fee: 1200 },
  { wilaya: '12 - Tébessa', fee: 800 },
  { wilaya: '13 - Tlemcen', fee: 800 },
  { wilaya: '14 - Tiaret', fee: 700 },
  { wilaya: '15 - Tizi Ouzou', fee: 600 },
  { wilaya: '16 - Alger', fee: 400 },
  { wilaya: '17 - Djelfa', fee: 700 },
  { wilaya: '18 - Jijel', fee: 700 },
  { wilaya: '19 - Sétif', fee: 700 },
  { wilaya: '20 - Saïda', fee: 800 },
  { wilaya: '21 - Skikda', fee: 700 },
  { wilaya: '22 - Sidi Bel Abbès', fee: 800 },
  { wilaya: '23 - Annaba', fee: 700 },
  { wilaya: '24 - Guelma', fee: 700 },
  { wilaya: '25 - Constantine', fee: 700 },
  { wilaya: '26 - Médéa', fee: 600 },
  { wilaya: '27 - Mostaganem', fee: 700 },
  { wilaya: '28 - M\'Sila', fee: 700 },
  { wilaya: '29 - Mascara', fee: 800 },
  { wilaya: '30 - Ouargla', fee: 900 },
  { wilaya: '31 - Oran', fee: 700 },
  { wilaya: '32 - El Bayadh', fee: 900 },
  { wilaya: '33 - Illizi', fee: 1200 },
  { wilaya: '34 - Bordj Bou Arréridj', fee: 700 },
  { wilaya: '35 - Boumerdès', fee: 500 },
  { wilaya: '36 - El Tarf', fee: 800 },
  { wilaya: '37 - Tindouf', fee: 1200 },
  { wilaya: '38 - Tissemsilt', fee: 700 },
  { wilaya: '39 - El Oued', fee: 800 },
  { wilaya: '40 - Khenchela', fee: 800 },
  { wilaya: '41 - Souk Ahras', fee: 800 },
  { wilaya: '42 - Tipaza', fee: 500 },
  { wilaya: '43 - Mila', fee: 700 },
  { wilaya: '44 - Aïn Defla', fee: 700 },
  { wilaya: '45 - Naâma', fee: 900 },
  { wilaya: '46 - Aïn Témouchent', fee: 800 },
  { wilaya: '47 - Ghardaïa', fee: 800 },
  { wilaya: '48 - Relizane', fee: 700 },
  { wilaya: '49 - Timimoun', fee: 1000 },
  { wilaya: '50 - Bordj Badji Mokhtar', fee: 1200 },
  { wilaya: '51 - Ouled Djellal', fee: 800 },
  { wilaya: '52 - Béni Abbès', fee: 1000 },
  { wilaya: '53 - In Salah', fee: 1100 },
  { wilaya: '54 - In Guezzam', fee: 1200 },
  { wilaya: '55 - Touggourt', fee: 900 },
  { wilaya: '56 - Djanet', fee: 1200 },
  { wilaya: '57 - El M\'Ghair', fee: 950 },
  { wilaya: '58 - El Meniaa', fee: 950 }
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
// Body should be an array of { wilaya: string, fee: number }
router.put('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const prices = req.body;

    if (!Array.isArray(prices)) {
      res.status(400).json({ error: 'Body must be an array of { wilaya, fee }' });
      return;
    }

    // Validate that each item has a wilaya and fee
    for (const item of prices) {
      if (!item.wilaya || item.fee === undefined) {
        res.status(400).json({ error: 'Each pricing item must contain a wilaya name and a fee' });
        return;
      }
    }

    if (isPlaceholder) {
      // Apply updates in-memory
      for (const item of prices) {
        const idx = mockDeliveryPrices.findIndex(p => p.wilaya === item.wilaya);
        if (idx !== -1) {
          mockDeliveryPrices[idx].fee = Number(item.fee);
        } else {
          mockDeliveryPrices.push({ wilaya: item.wilaya, fee: Number(item.fee) });
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
