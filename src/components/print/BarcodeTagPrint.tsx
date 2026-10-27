import React from 'react';
import { JewelleryItem } from '../../types';
import { formatWeight } from '../../utils/formatters';
import { Printer } from 'lucide-react';

interface BarcodeTagPrintProps {
  item: JewelleryItem;
}

export const BarcodeTagPrint: React.FC<BarcodeTagPrintProps> = ({ item }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm mx-auto">
      <div className="flex justify-between items-center mb-4 no-print">
        <span className="text-xs text-slate-400">Jewellery Tag Sticker (50mm x 15mm)</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Tag
        </button>
      </div>

      {/* Actual Jewelry Tag Sticker simulation */}
      <div className="bg-white text-slate-950 p-2.5 rounded border border-slate-300 w-64 shadow-md font-mono text-[9px] leading-tight printable-area mx-auto">
        <div className="flex justify-between items-start border-b border-slate-300 pb-1 mb-1">
          <span className="font-bold text-[10px] truncate max-w-[140px] uppercase font-sans">
            {item.name}
          </span>
          <span className="bg-amber-100 text-amber-900 px-1 rounded font-bold">
            {item.purity?.karat_code || item.purity?.karatCode || '22K'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px]">
          <div>GW: <span className="font-bold">{formatWeight(item.gross_weight)}</span></div>
          <div>NW: <span className="font-bold">{formatWeight(item.net_weight)}</span></div>
          <div>SW: <span>{formatWeight(item.stone_weight)}</span></div>
          <div>HUID: <span className="font-bold">{item.huid || 'N/A'}</span></div>
        </div>

        {/* Barcode visual rendering */}
        <div className="mt-1.5 pt-1 border-t border-slate-200 text-center">
          <div className="h-6 flex items-center justify-center space-x-[2px] bg-slate-100 px-1 py-0.5 rounded">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className="bg-black h-full"
                style={{ width: `${(i % 3 === 0 ? 2 : 1)}px` }}
              />
            ))}
          </div>
          <div className="text-[8px] font-bold tracking-widest mt-0.5">{item.tag_code}</div>
        </div>
      </div>
    </div>
  );
};
