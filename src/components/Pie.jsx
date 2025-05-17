import { ResponsivePie } from "@nivo/pie";
import "../style/Pie.css";

const Pie = ({ data }) => {
  const allZero = data.every(item => item.value === 0);

  const fill = data.map(item => ({
    match: { id: item.id },
    id: Math.random() > 0.5 ? "dots" : "lines"
  }));

  console.log(data);
  if (allZero) {
    return (
      <div className="pie-no-data">
        <div>
          <img src="/assets/notfound.png" alt="No data" />
          <br />
          <strong>📡 Sin datos por ahora… Los sensores siguen escaneando. </strong>
          <br />
        </div>
      </div>
    );
  }

  return (
    <div className="pie-container">
      <ResponsivePie
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        colors={{ datum: "data.color" }}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        enableArcLinkLabels={false}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
        defs={[
          {
            id: "dots",
            type: "patternDots",
            background: "inherit",
            color: "rgba(183, 64, 64, 0.3)",
            size: 4,
            padding: 1,
            stagger: true
          },
          {
            id: "lines",
            type: "patternLines",
            background: "inherit",
            color: "rgba(255, 255, 255, 0.3)",
            rotation: -45,
            lineWidth: 6,
            spacing: 10
          }
        ]}
        fill={fill}
        legends={[]}
        tooltip={({ datum }) => (
          <div
            style={{
              background: "white",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              color: "#333"
            }}
          >
            <strong>{datum.label}</strong>: {datum.value}
          </div>
        )}
      />
    </div>
  );
};

export default Pie;
