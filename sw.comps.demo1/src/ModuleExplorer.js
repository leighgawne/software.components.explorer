import React, { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, ChevronRight, ChevronDown, Upload, Download, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import './ModuleExplorer.css';

// --- UI primitives ---
const Button = ({className = "", variant="default", size="md", icon, children, ...props}) => {
  const base = "inline-flex items-center gap-2 rounded-2xl shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    default: "bg-black text-white hover:bg-gray-800 focus:ring-black",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 focus:ring-gray-400",
    ghost: "hover:bg-gray-100 text-gray-700"
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2", lg: "px-5 py-2.5 text-lg" };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{icon}{children}</button>
  );
};

const Input = ({className = "", ...props}) => (
  <input className={`w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${className}`} {...props} />
);

const Chip = ({label}) => (
  <span className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600">{label}</span>
);

// --- Seed data: concise but representative. Replace or extend via the Import button. ---
const SEED = [
  { module: "UART", class: "Communication", config: [
    { name: "baud_rate", type: "integer", unit: "baud", min: 300, max: 3000000, default: 115200 },
    { name: "data_bits", type: "enum", values: [5,6,7,8,9], default: 8 },
    { name: "parity", type: "enum", values: ["none","even","odd","mark","space"], default: "none" },
    { name: "stop_bits", type: "enum", values: [1,1.5,2], default: 1 },
    { name: "flow_control", type: "enum", values: ["none","rts_cts","xon_xoff"], default: "none" },
    { name: "rx_buffer_size", type: "integer", unit: "bytes", min: 16, max: 65536, default: 1024 },
    { name: "tx_buffer_size", type: "integer", unit: "bytes", min: 16, max: 65536, default: 1024 }
  ]},
  { module: "SPI", class: "Communication", config: [
    { name: "clock_hz", type: "integer", unit: "Hz", min: 1000, max: 100000000, default: 10000000 },
    { name: "mode", type: "enum", values: ["MODE0","MODE1","MODE2","MODE3"], default: "MODE0" },
    { name: "bit_order", type: "enum", values: ["msb_first","lsb_first"], default: "msb_first" },
    { name: "frame_bits", type: "integer", unit: "bits", min: 4, max: 32, default: 8 },
    { name: "cs_active_polarity", type: "enum", values: ["low","high"], default: "low" },
    { name: "cs_setup_time", type: "integer", unit: "ns", min: 0, max: 1000, default: 50 },
    { name: "cs_hold_time", type: "integer", unit: "ns", min: 0, max: 1000, default: 50 }
  ]},
  { module: "I2C", class: "Communication", config: [
    { name: "bus_speed", type: "enum", values: ["standard@100k","fast@400k","fast_plus@1M","hs@3.4M"], default: "fast@400k" },
    { name: "addressing_mode", type: "enum", values: ["7bit","10bit"], default: "7bit" },
    { name: "own_address", type: "integer", unit: "addr", min: 0, max: 1023, default: 80 },
    { name: "clock_stretching", type: "boolean", default: true },
    { name: "timeout", type: "integer", unit: "ms", min: 0, max: 10000, default: 1000 }
  ]},
  { module: "Ethernet MAC", class: "Networking", config: [
    { name: "mac_address", type: "string", pattern: "xx:xx:xx:xx:xx:xx", default: "02:00:00:00:00:00" },
    { name: "link_speed", type: "enum", values: ["10M","100M","1000M"], default: "100M" },
    { name: "duplex", type: "enum", values: ["half","full"], default: "full" },
    { name: "phy_interface", type: "enum", values: ["MII","RMII","RGMII"], default: "RMII" }
  ]},
  { module: "WiFi", class: "Networking", config: [
    { name: "ssid", type: "string" },
    { name: "security", type: "enum", values: ["open","wep","wpa2_psk","wpa3_sae","wpa2_wpa3_mixed"], default: "wpa2_psk" },
    { name: "band", type: "enum", values: ["2.4GHz","5GHz","6GHz"], default: "2.4GHz" },
    { name: "channel", type: "integer", min: 1, max: 196, default: 6 }
  ]},
  { module: "Bluetooth LE", class: "Networking", config: [
    { name: "role", type: "enum", values: ["central","peripheral"], default: "peripheral" },
    { name: "device_name", type: "string", default: "ble-device" },
    { name: "mtu", type: "integer", unit: "bytes", min: 23, max: 517, default: 247 },
    { name: "conn_interval", type: "number", unit: "ms", min: 7.5, max: 4000, default: 30 }
  ]},
  { module: "ADC", class: "Analog", config: [
    { name: "resolution", type: "enum", values: ["8","10","12","14","16"], default: "12" },
    { name: "sample_rate", type: "integer", unit: "S/s", min: 1, max: 2000000, default: 10000 },
    { name: "channels", type: "array<integer>" },
    { name: "reference", type: "enum", values: ["internal","external"], default: "internal" }
  ]},
  { module: "PWM", class: "Timing", config: [
    { name: "frequency", type: "integer", unit: "Hz", min: 1, max: 1000000, default: 20000 },
    { name: "duty_cycle", type: "number", unit: "%", min: 0, max: 100, default: 50 },
    { name: "alignment", type: "enum", values: ["edge","center"], default: "edge" },
    { name: "polarity", type: "enum", values: ["active_high","active_low"], default: "active_high" }
  ]},
  { module: "ML Inference", class: "Compute/ML", config: [
    { name: "model_format", type: "enum", values: ["TFLite","ONNX","TensorFlow","CArray"], default: "TFLite" },
    { name: "quantization", type: "enum", values: ["int8","float16","float32"], default: "int8" },
    { name: "accelerator", type: "enum", values: ["cpu","cmsis-nn","ethos-u","gpu"], default: "cmsis-nn" },
    { name: "arena_size", type: "integer", unit: "KB", min: 32, max: 262144, default: 1024 }
  ]}
];

// --- Helpers ---
const groupByClass = (mods) => mods.reduce((acc, m) => {
  (acc[m.class] ||= []).push(m); return acc;
}, {});

function useLocalState(key, initial) {
  const [val, setVal] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// --- Components ---
const Sidebar = ({classes, counts, selected, onSelect}) => {
  return (
    <div className="h-full w-64 shrink-0 border-r border-gray-200 p-3 overflow-y-auto">
      <div className="mb-3 flex items-center gap-2 text-gray-700">
        <SlidersHorizontal className="h-4 w-4"/>
        <span className="font-semibold">Classes</span>
      </div>
      <button className={`w-full text-left mb-1 rounded-xl px-3 py-2 hover:bg-gray-100 ${selected===null?"bg-gray-900 text-white hover:bg-gray-900":""}`} onClick={()=>onSelect(null)}>
        All <span className="float-right text-xs text-gray-500">{Object.values(counts).reduce((a,b)=>a+b,0)}</span>
      </button>
      {classes.map(cls => (
        <button key={cls} className={`w-full text-left mb-1 rounded-xl px-3 py-2 hover:bg-gray-100 ${selected===cls?"bg-gray-900 text-white hover:bg-gray-900":""}`} onClick={()=>onSelect(cls)}>
          {cls} <span className="float-right text-xs text-gray-500">{counts[cls]||0}</span>
        </button>
      ))}
    </div>
  );
};

const ConfigTable = ({config}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="border-b p-2">Name</th>
            <th className="border-b p-2">Type</th>
            <th className="border-b p-2">Unit</th>
            <th className="border-b p-2">Range</th>
            <th className="border-b p-2">Values</th>
            <th className="border-b p-2">Default</th>
          </tr>
        </thead>
        <tbody>
          {config.map((p, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="border-b p-2 font-medium">{p.name}</td>
              <td className="border-b p-2">{p.type}</td>
              <td className="border-b p-2">{p.unit || ""}</td>
              <td className="border-b p-2">{(p.min!==undefined||p.max!==undefined)?`${p.min ?? ""} – ${p.max ?? ""}`:""}</td>
              <td className="border-b p-2">{p.values? Array.isArray(p.values)? p.values.join(", ") : String(p.values): ""}</td>
              <td className="border-b p-2">{p.default!==undefined? JSON.stringify(p.default):""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ModuleCard = ({m, onSelect, selected}) => (
  <motion.div layout onClick={onSelect} className={`cursor-pointer rounded-2xl border border-gray-200 p-4 shadow-sm transition hover:shadow ${selected?"ring-2 ring-black": ""}`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">{m.class}</div>
        <div className="text-lg font-semibold">{m.module}</div>
      </div>
      {selected ? <ChevronDown/> : <ChevronRight/>}
    </div>
    <div className="mt-3 flex flex-wrap gap-1">
      {m.config.slice(0,6).map((p, idx) => <Chip key={idx} label={p.name} />)}
      {m.config.length>6 && <Chip label={`+${m.config.length-6} more`} />}
    </div>
  </motion.div>
);

const Toolbar = ({onImport, data}) => {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modules.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed)) onImport(parsed);
        else alert("Invalid format: expected an array of modules");
      } catch (e) { alert("Failed to parse JSON: "+ e.message); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm cursor-pointer hover:bg-gray-50">
        <Upload className="h-4 w-4"/>
        Import JSON
        <input type="file" accept="application/json" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if (f) importJson(f);}} />
      </label>
      <Button variant="outline" icon={<Download className="h-4 w-4"/>} onClick={exportJson}>Export</Button>
    </div>
  );
};

// --- Main App ---
export default function ModuleExplorer() {
  const [data, setData] = useLocalState("mods:data", SEED);
  const [q, setQ] = useLocalState("mods:q", "");
  const [cls, setCls] = useLocalState("mods:class", null);
  const [active, setActive] = useState(data[0] ?? null);

  useEffect(()=>{
    if (active) {
      const exists = data.find(m => m.module===active.module && m.class===active.class);
      if (!exists) setActive(data[0] ?? null);
    }
  }, [data]);

  const grouped = useMemo(()=> groupByClass(data), [data]);
  const classes = useMemo(()=> Object.keys(grouped).sort(), [grouped]);
  const counts = useMemo(()=> Object.fromEntries(classes.map(c => [c, grouped[c].length])), [classes, grouped]);

  const filtered = useMemo(()=>{
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let mods = cls? (grouped[cls] ?? []) : data;
    if (words.length===0) return mods;
    return mods.filter(m => {
      const hay = `${m.module} ${m.class} ${m.config.map(p=>p.name+" "+p.type+" "+(p.values||[])).join(" ")}`.toLowerCase();
      return words.every(w => hay.includes(w));
    });
  }, [q, data, cls, grouped]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-black px-3 py-1 text-white">ESD</div>
              <h1 className="text-xl font-semibold">Software Component Explorer</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                <Input placeholder="Search modules, params, types…" value={q} onChange={e=>setQ(e.target.value)} className="pl-9"/>
              </div>
              <Toolbar onImport={setData} data={data} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4">
        <div className="flex gap-6 py-6">
          <Sidebar classes={classes} counts={counts} selected={cls} onSelect={setCls} />

          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-600">Showing <b>{filtered.length}</b> of <b>{data.length}</b> modules{cls? <> in <b>{cls}</b></>: null}.</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(m => (
                <ModuleCard key={m.class+"/"+m.module} m={m} onSelect={()=>setActive(m)} selected={active?.module===m.module && active?.class===m.class} />
              ))}
            </div>

            <AnimatePresence>
              {active && (
                <motion.div key={active.module} layout initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow">
                  <div className="mb-1 text-sm text-gray-500">{active.class}</div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">{active.module}</h2>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4"/>} onClick={()=>setActive({...active})}>Refresh</Button>
                    </div>
                  </div>
                  <ConfigTable config={active.config} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-gray-500">
          Built for exploratory configuration design — import your JSON to view full catalogs.
        </div>
      </footer>
    </div>
  );
}
