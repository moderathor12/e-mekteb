import React from 'react';
import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <ShieldX className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">İcazə Verilmədi (403)</h2>
        <p className="text-sm text-slate-600 mb-6">
          Bu səhifəyə və ya məlumata baxmaq üçün kifayət qədər hüququnuz yoxdur. Əgər bunun bir səhv olduğunu düşünürsünüzsə, məktəb rəhbərliyi ilə əlaqə saxlayın.
        </p>
        <Link href="/login">
          <Button variant="primary" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Əsas səhifəyə qayıt
          </Button>
        </Link>
      </div>
    </div>
  );
}
