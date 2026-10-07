import React from 'react';
import { Beaker, FileCode, CheckCircle2, Database, Table } from 'lucide-react';

export const MaterialsLibraryWorkspace: React.FC = () => {
  const materials = [
    {
      name: 'Acrylic Copolymer Emulsion (Resin)',
      cas: '25085-34-1',
      wtPct: '62.0 %',
      density: '1.08 g/cm³',
      baseVisc: '1450 cP',
      function: 'Primary film-forming binder and structural matrix.',
      status: 'VERIFIED',
    },
    {
      name: 'Titanium Dioxide (Rutile TiO₂) Slurry',
      cas: '13463-67-7',
      wtPct: '24.0 %',
      density: '1.75 g/cm³',
      baseVisc: '4200 cP',
      function: 'High refractive index white opacifying pigment and UV shield.',
      status: 'VERIFIED',
    },
    {
      name: 'Demineralized Water (Solvent)',
      cas: '7732-18-5',
      wtPct: '12.0 %',
      density: '1.00 g/cm³',
      baseVisc: '1.0 cP',
      function: 'Continuous liquid carrier and viscosity attenuation medium.',
      status: 'VERIFIED',
    },
    {
      name: 'HEUR Associative Rheology Modifier',
      cas: 'Proprietary Polyurethane',
      wtPct: '1.5 %',
      density: '1.04 g/cm³',
      baseVisc: '6800 cP',
      function: 'Pseudoplastic shear-thinning and high-shear roller application control.',
      status: 'VERIFIED',
    },
    {
      name: 'Mineral-Oil Defoamer & Biocide',
      cas: 'Blend',
      wtPct: '0.5 %',
      density: '0.92 g/cm³',
      baseVisc: '250 cP',
      function: 'Micro-foam de-aeration and microbial preservation.',
      status: 'VERIFIED',
    },
  ];

  return (
    <div className="h-full w-full bg-[#151515] eda-grid-canvas flex flex-col overflow-y-auto select-none p-3 text-[#F2F2F2] font-mono">
      {/* 1. Header Command Bar */}
      <div className="bg-[#242424] border border-[#383838] rounded-[2px] px-3 py-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Beaker className="w-4 h-4 text-[#B388FF]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F2F2F2] uppercase tracking-wider">
                CHEMICAL FORMULATION & MATERIALS LIBRARY
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-[#202020] border border-[#383838] text-[#929292] rounded-[2px]">
                RECIPE SPECIFICATION
              </span>
            </div>
            <p className="text-[10px] text-[#929292]">
              Paint Recipe Ingredients, Component Densities, and Baseline Rheological Parameters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] text-[#929292]">ACTIVE FORMULATION:</span>
          <span className="text-[#B388FF] font-bold bg-[#2A1D3A] px-2 py-0.5 rounded-[2px] border border-[#4E316B] text-[10px]">
            ARCHITECTURAL EMULSION (BATCH-024)
          </span>
        </div>
      </div>

      {/* 2. Materials Specification Table */}
      <div className="bg-[#242424] border border-[#383838] rounded-[2px] p-3">
        <div className="text-xs font-bold text-[#F2F2F2] uppercase border-b border-[#383838] pb-2 mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-3.5 h-3.5 text-[#4C8DFF]" />
            <span className="text-[11px]">RECIPE COMPONENT PARAMETERS</span>
          </div>
          <span className="text-[10px] text-[#929292]">5 FORMULATION COMPONENTS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs eda-table border border-[#383838]">
            <thead className="bg-[#1B1B1B] text-[#929292] text-[10px] uppercase border-b border-[#383838]">
              <tr>
                <th className="py-2 px-3">Raw Material / Ingredient</th>
                <th className="py-2 px-3">Weight Ratio</th>
                <th className="py-2 px-3">Density</th>
                <th className="py-2 px-3">Base Viscosity</th>
                <th className="py-2 px-3">Process Function</th>
                <th className="py-2 px-3">QC Spec</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B] text-[11px] text-[#C5C5C5]">
              {materials.map((m, idx) => (
                <tr key={idx} className="hover:bg-[#2B2B2B] transition-colors">
                  <td className="py-2 px-3">
                    <span className="font-bold text-[#F2F2F2] block">{m.name}</span>
                    <span className="text-[10px] text-[#929292]">CAS: {m.cas}</span>
                  </td>
                  <td className="py-2 px-3 font-bold text-[#39B8D3]">{m.wtPct}</td>
                  <td className="py-2 px-3 text-[#F2F2F2]">{m.density}</td>
                  <td className="py-2 px-3 text-[#D6A548] font-bold">{m.baseVisc}</td>
                  <td className="py-2 px-3 text-[#929292] max-w-xs">{m.function}</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.2 rounded-[2px] bg-[#1E3324] text-[#4CAF72] border border-[#2D5A34] text-[9px] font-bold">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
