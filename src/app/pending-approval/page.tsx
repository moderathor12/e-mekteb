import React from 'react';
import Link from 'next/link';
import { Clock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Hesab Təsdiq Gözləyir</h2>
        <p className="text-sm text-slate-600 mb-6">
          Hesabınız yaradılıb, lakin məktəb rəhbərliyi və ya sinif rəhbəri tərəfindən hələ təsdiqlənməyib. Müraciətiniz təsdiqləndikdən sonra platformaya tam giriş əldə edəcəksiniz.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Giriş səhifəsinə qayıt
          </Button>
        </Link>
      </div>
    </div>
  );
}
