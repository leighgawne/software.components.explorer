import React, { useState } from "react";
import data from "./motor_model.json"; // put your JSON file into /src

function App() {
  const [groupBy, setGroupBy] = useState("MCU (MCB)");

  // Group data by selected key
  const grouped = data.reduce((acc, item) => {
    const key = item[groupBy] || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Motor Control Explorer</h1>

      <label>
        Group by:{" "}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
        >
          {Object.keys(data[0]).map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: "20px" }}>
        {Object.entries(grouped).map(([key, items]) => (
          <div key={key} style={{ marginBottom: "30px" }}>
            <h2>
              {groupBy}: <span style={{ color: "blue" }}>{key}</span>
            </h2>
            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  {Object.keys(data[0]).map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr key={i}>
                    {Object.keys(data[0]).map((col) => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
