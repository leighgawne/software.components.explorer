import { useEffect, useMemo, useState } from "react";

// App.tsx — plain React, no external UI libs.
// Updated to: use `unique_sw_projects` to build the projects list and
// group all entries in `sw_projects_to_eval_kit` by sw_project_name.
// JSON shape:
// {
//   "eval_kits": [{ eval_kit_name, eval_kit_github_path }, ...],
//   "unique_sw_projects": ["freertos", "_quickstart", ...],
//   "sw_projects_to_eval_kit": [
//      {
//        sw_project_name,
//        eval_kit_to_sw_project_mapping: [
//          { eval_kit_name, github_path, config_xml_path?, ra_config_path?, readme_path? }, ...
//        ]
//      }, ... // may contain multiple blocks with the SAME sw_project_name
//   ]
// }

// ---- Types ---------------------------------------------------------------

type KitLite = {
  eval_kit_name: string;
  eval_kit_github_path: string;
};

type Mapping = {
  eval_kit_name: string;
  github_path: string;
  config_xml_path?: string;
  ra_config_path?: string;
  readme_path?: string;
};

type ProjectBlock = {
  sw_project_name: string;
  eval_kit_to_sw_project_mapping: Mapping[];
};

type Root = {
  eval_kits: KitLite[];
  unique_sw_projects: string[];
  sw_projects_to_eval_kit: ProjectBlock[];
};

// ---- Fallback sample (tiny) ---------------------------------------------
const SAMPLE: Root = {
  eval_kits: [
    { eval_kit_name: "ck_ra6m5", eval_kit_github_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ck_ra6m5/" },
    { eval_kit_name: "ek_ra2a1", eval_kit_github_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ek_ra2a1/" },
  ],
  unique_sw_projects: ["freertos", "_quickstart"],
  sw_projects_to_eval_kit: [
    {
      sw_project_name: "freertos",
      eval_kit_to_sw_project_mapping: [
        {
          eval_kit_name: "ck_ra6m5",
          github_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ck_ra6m5/freertos/freertos_ck_ra6m5_ep",
          config_xml_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ck_ra6m5/freertos/freertos_ck_ra6m5_ep/e2studio/configuration.xml",
          ra_config_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ck_ra6m5/freertos/freertos_ck_ra6m5_ep/e2studio/ra_cfg.txt",
          readme_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ck_ra6m5/freertos/freertos_ck_ra6m5_ep/readme.txt",
        },
      ],
    },
    {
      sw_project_name: "_quickstart",
      eval_kit_to_sw_project_mapping: [
        {
          eval_kit_name: "ek_ra2a1",
          github_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ek_ra2a1/_quickstart/_quickstart_ek_ra2a1_ep",
          config_xml_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ek_ra2a1/_quickstart/_quickstart_ek_ra2a1_ep/e2studio/configuration.xml",
          ra_config_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ek_ra2a1/_quickstart/_quickstart_ek_ra2a1_ep/e2studio/ra_cfg.txt",
          readme_path: "https://github.com/renesas/ra-fsp-examples/tree/master/example_projects/ek_ra2a1/_quickstart/_quickstart_ek_ra2a1_ep/readme.txt",
        },
      ],
    },
  ],
};

// ---- Helpers -------------------------------------------------------------
const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
const norm = (s: string) => (s || "").toLowerCase();

function buildIndexes(root: Root) {
  // Build a map project -> aggregated mappings across ALL matching blocks.
  // Start by seeding from unique_sw_projects so we keep a canonical project list.
  const projectsIndex = new Map<string, { name: string; kits: string[]; linksByKit: Map<string, Mapping[]> }>();
  for (const pname of root.unique_sw_projects || []) {
    projectsIndex.set(pname, { name: pname, kits: [], linksByKit: new Map<string, Mapping[]>() });
  }

  for (const blk of root.sw_projects_to_eval_kit) {
    const node = projectsIndex.get(blk.sw_project_name) || { name: blk.sw_project_name, kits: [], linksByKit: new Map<string, Mapping[]>() };
    for (const m of blk.eval_kit_to_sw_project_mapping || []) {
      if (!node.linksByKit.has(m.eval_kit_name)) node.linksByKit.set(m.eval_kit_name, []);
      node.linksByKit.get(m.eval_kit_name)!.push(m);
    }
    projectsIndex.set(blk.sw_project_name, node);
  }

  // finalize kits arrays (sorted, unique)
  for (const p of projectsIndex.values()) {
    p.kits = Array.from(p.linksByKit.keys()).sort();
  }

  // kitsIndex: kit -> { name, projects: string[], linksByProject: Map<project, Mapping[]> }
  const kitsIndex = new Map<string, { name: string; projects: string[]; linksByProject: Map<string, Mapping[]>; kitRoot?: string }>();
  const kitRootMap = new Map<string, string>();
  for (const k of root.eval_kits || []) kitRootMap.set(k.eval_kit_name, k.eval_kit_github_path);

  for (const blk of root.sw_projects_to_eval_kit) {
    const proj = blk.sw_project_name;
    for (const m of blk.eval_kit_to_sw_project_mapping || []) {
      const node = kitsIndex.get(m.eval_kit_name) || { name: m.eval_kit_name, projects: [], linksByProject: new Map<string, Mapping[]>() };
      node.projects.push(proj);
      const list = node.linksByProject.get(proj) || [];
      list.push(m);
      node.linksByProject.set(proj, list);
      kitsIndex.set(m.eval_kit_name, node);
    }
  }

  // finalize
  for (const v of kitsIndex.values()) {
    v.projects = uniq(v.projects).sort();
    v.kitRoot = kitRootMap.get(v.name);
  }

  return { projectsIndex, kitsIndex };
}

// ---- Component ------------------------------------------------------------
export default function App() {
  const [root, setRoot] = useState<Root | null>(null);
  const [mode, setMode] = useState<"projects" | "kits">("projects");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("https://ngv.rs/a?alias=leighs.micro.webapp.demo7.nano.data.1.eval_kits_sw.json&dr=true", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = (await res.json()) as Root[];
        if (!cancelled) setRoot(json[0]);
      } catch (e) {
        if (!cancelled) {
          setError("Couldn't load /eval_kits_and_sw_projects.json. Using a tiny built-in sample so the UI still works.");
          setRoot(SAMPLE);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { projectsIndex, kitsIndex } = useMemo(() => {
    if (!root) return { projectsIndex: new Map<string, any>(), kitsIndex: new Map<string, any>() };
    return buildIndexes(root);
  }, [root]);

  const names = useMemo(() => {
    if (!root) return [] as string[];
    if (mode === "projects") {
      // Use the canonical order from unique_sw_projects when possible; fall back to keys of projectsIndex.
      const list = (root.unique_sw_projects && root.unique_sw_projects.length)
        ? root.unique_sw_projects.slice()
        : Array.from(projectsIndex.keys());
      return list.sort();
    }
    return Array.from(kitsIndex.keys()).sort();
  }, [root, mode, projectsIndex, kitsIndex]);

  const filtered = useMemo(() => {
    const q = norm(query);
    return names.filter(n => norm(n).includes(q));
  }, [names, query]);

  return (
    <div style={{display:"flex", flexDirection:"column", minHeight:"100vh", background:"#111", color:"#eee", padding:"1rem", fontFamily:"system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <h1 style={{margin:0}}>RA Examples Explorer</h1>
        <button onClick={() => window.location.reload()} style={{background:"#2a2b31", color:"#fff", border:"1px solid #333", padding:"8px 10px", borderRadius:8}}>Reload</button>
      </div>
      <p style={{color:"#a9acb2", marginTop:6}}>Browse by <b>software project</b> or <b>eval kit</b>. Selecting one shows all compatible matches with links.</p>

      <div style={{display:"flex", gap:8, marginBottom:8}}>
        <button onClick={() => setMode("projects")} style={{padding:"8px 10px", background:mode==="projects"?"#444":"#222", color:"#fff", border:"1px solid #333", borderRadius:8}}>Software projects</button>
        <button onClick={() => setMode("kits")} style={{padding:"8px 10px", background:mode==="kits"?"#444":"#222", color:"#fff", border:"1px solid #333", borderRadius:8}}>Eval kits</button>
      </div>

      <input placeholder={mode==="projects"?"Filter projects…":"Filter eval kits…"} value={query} onChange={(e)=>setQuery(e.target.value)}
             style={{padding:"10px 12px", marginBottom:12, width:"100%", maxWidth:420, background:"#121214", color:"#e7e7ea", border:"1px solid #232326", borderRadius:10}} />

      <div style={{display:"grid", gridTemplateColumns:"1fr 2fr", gap:16}}>
        <div>
          <div style={{background:"#121214", border:"1px solid #232326", borderRadius:12, padding:8}}>
            {loading && <div style={{color:"#a8abb2", fontSize:13}}>Loading…</div>}
            {!loading && filtered.length === 0 && <div style={{color:"#a8abb2", fontSize:13}}>No matches.</div>}
          </div>
          <ul style={{listStyle:"none", padding:0, margin:"8px 0", maxHeight:"65vh", overflow:"auto"}}>
            {filtered.map(name => (
              <li key={name}>
                <button onClick={() => setPicked(name)}
                        style={{width:"100%", textAlign:"left", padding:"10px", marginBottom:6, background:picked===name?"#2a2b31":"#121214", color:"#e7e7ea", border:"1px solid #232326", borderRadius:10}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <span>{name}</span>
                    <span style={{border:"1px solid #2f2f35", borderRadius:999, padding:"2px 8px", fontSize:11, color:"#cfd1d6"}}>
                      {mode === "projects" ? `${projectsIndex.get(name)?.kits.length ?? 0} kits` : `${kitsIndex.get(name)?.projects.length ?? 0} projects`}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {error && <div style={{color:"#ffd166", fontSize:12}}>{error}</div>}
        </div>

        <div>
          <div style={{background:"#121214", border:"1px solid #232326", borderRadius:12, padding:16, minHeight:200}}>
            {!picked ? (
              <div style={{color:"#a8abb2", fontSize:14}}>Select a {mode === "projects"?"software project":"kit"} on the left to see details.</div>
            ) : mode === "projects" ? (
              <ProjectDetails name={picked} projectsIndex={projectsIndex} />
            ) : (
              <KitDetails name={picked} kitsIndex={kitsIndex} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Details --------------------------------------------------------------
function ProjectDetails({ name, projectsIndex }:{ name:string; projectsIndex: Map<string, { name:string; kits:string[]; linksByKit: Map<string, Mapping[]> }> }) {
  const node = projectsIndex.get(name);
  const kits = node?.kits ?? [];
  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h2 style={{margin:"0 0 4px"}}>Project: {name}</h2>
          <div style={{color:"#a8abb2", fontSize:13}}>Compatible eval kits ({kits.length})</div>
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))", gap:12, marginTop:12}}>
        {kits.map(kit => (
          <CompatCard key={kit} title={kit} subtitle="Eval kit" links={(node?.linksByKit.get(kit) || []).map(m => toLink(m))} />
        ))}
      </div>
    </div>
  );
}

function KitDetails({ name, kitsIndex }:{ name:string; kitsIndex: Map<string, { name:string; projects:string[]; linksByProject: Map<string, Mapping[]>; kitRoot?: string }> }) {
  const node = kitsIndex.get(name);
  const projects = node?.projects ?? [];
  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h2 style={{margin:"0 0 4px"}}>Eval kit: {name}</h2>
          <div style={{color:"#a8abb2", fontSize:13}}>Compatible software projects ({projects.length})</div>
          {node?.kitRoot && (
            <div style={{marginTop:6}}>
              <a href={node.kitRoot} target="_blank" rel="noreferrer" style={{color:"#9ec5ff", fontSize:12}}>Kit root on GitHub</a>
            </div>
          )}
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))", gap:12, marginTop:12}}>
        {projects.map(proj => (
          <CompatCard key={proj} title={proj} subtitle="Software project" links={(node?.linksByProject.get(proj) || []).map(m => toLink(m))} />
        ))}
      </div>
    </div>
  );
}

function toLink(m: Mapping) {
  return {
    label: (m.github_path.split("/").slice(-1)[0] || "example"),
    github: m.github_path,
    config: m.config_xml_path,
    ra_cfg: m.ra_config_path,
    readme: m.readme_path,
  } as { label:string; github:string; config?:string; ra_cfg?:string; readme?:string };
}

function CompatCard({ title, subtitle, links }:{ title:string; subtitle:string; links:{label:string; github:string; config?:string; ra_cfg?:string; readme?:string}[] }) {
  return (
    <div style={{background:"#0e0e11", border:"1px solid #232326", borderRadius:10, padding:10}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
        <div style={{fontWeight:600}}>{title}</div>
        <span style={{border:"1px solid #2f2f35", color:"#cfd1d6", fontSize:10, borderRadius:999, padding:"2px 8px"}}>{subtitle}</span>
      </div>
      <div style={{height:1, background:"#232326", margin:"8px 0"}} />
      {links.length === 0 ? (
        <div style={{color:"#a8abb2", fontSize:13}}>No direct example links found.</div>
      ) : (
        links.map((lnk, i) => (
          <div key={i} style={{display:"flex", justifyContent:"space-between", gap:8, alignItems:"baseline", margin:"4px 0"}}>
            <div style={{fontSize:12, color:"#cfd1d6", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{lnk.label}</div>
            <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
              <a href={lnk.github} target="_blank" rel="noreferrer" style={{color:"#9ec5ff", fontSize:12}}>GitHub</a>
              {lnk.readme && <a href={lnk.readme} target="_blank" rel="noreferrer" style={{color:"#9ec5ff", fontSize:12}}>readme.txt</a>}
              {lnk.config && <a href={lnk.config} target="_blank" rel="noreferrer" style={{color:"#9ec5ff", fontSize:12}}>configuration.xml</a>}
              {lnk.ra_cfg && <a href={lnk.ra_cfg} target="_blank" rel="noreferrer" style={{color:"#9ec5ff", fontSize:12}}>ra_cfg.txt</a>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
