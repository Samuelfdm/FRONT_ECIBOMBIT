import { ResponsivePie } from "@nivo/pie";

const Pie = ({ data }) => {
  // Generar patrones de relleno aleatorios
  const fill = data.map(item => ({
    match: { id: item.id },
    id: Math.random() > 0.5 ? "dots" : "lines"
  }));

  return (
    <div style={{ height: "30vh", width: "25vw", marginTop: "5px", backgroundColor:"#fffff" }}>
      <ResponsivePie
        data={data}
        margin={{ top: 10, right:10 , bottom: 10, left: 10 }} // espacio abajo para leyenda
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        colors={{ datum: "data.color" }}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        enableArcLinkLabels={false}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor=""
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
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
