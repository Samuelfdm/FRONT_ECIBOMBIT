import { ResponsivePie } from "@nivo/pie";

const Pie = ({ data }) => {
  // Generar aleatoriamente fill patterns
  const fill = data.map(item => ({
    match: { id: item.id },
    id: Math.random() > 0.5 ? "dots" : "lines"
  }));

  return (
        <div style={{ height: "25vh", width: "20vw", marginTop: "10px" }}>
            <ResponsivePie
                data={data}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ datum: "data.color" }}
                borderWidth={1}
                borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: "color" }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}

                // 📌 Add pattern definitions
                defs={[
                        {
                            id: "dots",
                            type: "patternDots",
                            background: "inherit",
                            color: "rgba(255, 255, 255, 0.3)",
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
                fill={fill} // 🎯 Apply dynamic fill
                legends={[
                    {
                        anchor: "bottom",
                        direction: "row",
                        translateY: 56,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: "#999",
                        symbolSize: 18,
                        symbolShape: "circle",
                        effects: [
                        {
                            on: "hover",
                            style: {
                            itemTextColor: "#000"
                            }
                        }
                        ]
                    }
                ]}
            />
            </div>
        );
    };

export default Pie;
