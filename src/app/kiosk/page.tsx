'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Locker, Loan, Item } from '@/types/database';
import { Lock, Unlock, Wifi, Battery, Camera } from 'lucide-react';

export default function KioskPage() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [recentAction, setRecentAction] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Load initial locker state
    loadLockers();

    // Subscribe to real-time locker updates
    const channel = supabase
      .channel('kiosk-lockers')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lockers' },
        (payload) => {
          const updated = payload.new as Locker;
          setLockers((prev) =>
            prev.map((l) => (l.bay_code === updated.bay_code ? updated : l))
          );
          setRecentAction(
            `${updated.bay_code} ${updated.is_unlocked ? 'UNLOCKED' : 'LOCKED'} at ${new Date().toLocaleTimeString()}`
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'loans' },
        (payload) => {
          const updated = payload.new as Loan;
          setRecentAction(
            `Loan ${updated.id.slice(0, 8)}... status → ${updated.status} at ${new Date().toLocaleTimeString()}`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadLockers() {
    const { data } = await supabase.from('lockers').select('*').order('bay_code');
    if (data) setLockers(data as Locker[]);
  }

  // Simulate QR scan processing
  async function handleQRScan() {
    if (!qrInput.trim()) return;
    setScanning(true);

    try {
      const qrData = JSON.parse(qrInput);
      const { loan_id, locker_bay, action, qr_token } = qrData;

      // Verify loan exists
      const { data: loan } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loan_id)
        .single();

      if (!loan) {
        setRecentAction('❌ Invalid QR code - loan not found');
        return;
      }

      if ((loan as Loan).qr_token !== qr_token) {
        setRecentAction('❌ QR token mismatch');
        return;
      }

      // Unlock the locker
      await supabase
        .from('lockers')
        .update({ is_unlocked: true, last_updated: new Date().toISOString() })
        .eq('bay_code', locker_bay);

      if (action === 'PICKUP') {
        await supabase
          .from('loans')
          .update({ status: 'ACTIVE', collected_at: new Date().toISOString() })
          .eq('id', loan_id);

        await supabase
          .from('items')
          .update({ status: 'In Use' })
          .eq('id', (loan as Loan).item_id);

        setRecentAction(`✅ PICKUP: ${locker_bay} unlocked for loan ${loan_id.slice(0, 8)}...`);
      } else if (action === 'RETURN') {
        setRecentAction(`✅ RETURN: ${locker_bay} unlocked for return ${loan_id.slice(0, 8)}...`);
      }
    } catch {
      setRecentAction('❌ Invalid QR data format');
    } finally {
      setScanning(false);
      setQrInput('');
    }
  }

  return (
    <div className="min-h-screen bg-forest text-white">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pinjam Lah!</h1>
          <p className="text-white/60 text-sm mt-1">Central Park Kiosk · Smart Locker System</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">
            <Wifi size={14} className="text-green-300" />
            <span className="text-xs">Connected</span>
          </div>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Locker Grid */}
      <div className="px-8 mb-8">
        <h2 className="text-lg font-semibold mb-4">Locker Status</h2>
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          {lockers.map((locker) => (
            <div
              key={locker.bay_code}
              className={`rounded-2xl p-6 text-center transition-all duration-500 ${
                locker.is_unlocked
                  ? 'bg-mint text-forest shadow-lg shadow-green-500/20'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {locker.is_unlocked ? (
                <Unlock size={32} className="mx-auto mb-2 text-forest" />
              ) : (
                <Lock size={32} className="mx-auto mb-2" />
              )}
              <p className="font-bold text-lg">{locker.bay_code}</p>
              <p className="text-xs mt-1 opacity-70">
                {locker.is_unlocked ? 'UNLOCKED' : 'Locked'}
              </p>
              <div className="flex items-center justify-center gap-1 mt-2 opacity-50">
                <Battery size={10} />
                <span className="text-[10px]">{locker.battery_charge_pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Scanner Input (simulated) */}
      <div className="px-8 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera size={20} />
          QR Scanner
        </h2>
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-xs text-white/60 mb-2">
            Paste QR code data below to simulate a kiosk scan:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder='Paste QR JSON payload...'
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              onClick={handleQRScan}
              disabled={scanning}
              className="bg-white text-forest px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              {scanning ? '...' : 'Scan'}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="px-8 pb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white/10 rounded-2xl p-4">
          {recentAction ? (
            <p className="text-sm font-mono">{recentAction}</p>
          ) : (
            <p className="text-sm text-white/40">Waiting for scan events...</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 text-center">
        <p className="text-xs text-white/30">
          Pinjam Lah! IoT Kiosk v1.0 · Supabase Realtime Connected
        </p>
      </div>
    </div>
  );
}
