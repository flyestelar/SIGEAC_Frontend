import { pieChartData } from "@/types";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import { COLORS } from "@/lib/utils";
import { TickItem } from "recharts/types/util/types";

// Definición de la interfaz para las props del componente
interface DynamicBarChartProps {
  data: pieChartData[];
  title?: string;
  height: string;
  width: string;
  aspect?: number;
  activeDecimal?: boolean;
}

interface CustomizedAxisTickProps {
  x: number;
  y: number;
  payload: TickItem;
  theme: "light" | "dark";
}

const CustomizedAxisTick: React.FC<CustomizedAxisTickProps> = ({ x, y, payload, theme }) => {
  if (!payload || !payload.value) {
    return null;
  }
  const words = payload.value.toString().split(' ');
  const verticalSpacing = 7; // Espacio entre líneas de la misma etiqueta
  const spaceToChart = 5; // Espacio adicional hacia el gráfico

  return (
    <g transform={`translate(${x},${y + spaceToChart})`}> {/* Move the entire group down */}
      {words.map((word: string, i: number) => (
        <text
          x={0}
          y={i * verticalSpacing}
          dy={verticalSpacing / 2} // Ajusta la posición vertical de cada línea
          textAnchor="middle"
          fill={theme === "light" ? "black" : "white"}
          key={i}
          fontSize={9}
          className="text-wrap"
        >
          {word}
        </text>
      ))}
    </g>
  );
};
// Array de colores para las barras

const DynamicBarChart = ({
  data,
  title,
  height,
  width,
  activeDecimal,
  aspect,
}: DynamicBarChartProps) => {
  const { theme } = useTheme();
  const [clickedBarName, setClickedBarName] = useState<string | null>(null);

  const handleBarClick = (entry: pieChartData) => {
    const name = entry.name;
    setClickedBarName(name);
    console.log(name); // Imprimir en consola
  };

  return (
    <>
      <h1 className="text-sm font-semibold">{title}</h1>
      {/* {clickedBarName && (
        <p className="mt-2">Barra seleccionada: {clickedBarName}</p>
      )} */}
      <ResponsiveContainer aspect={aspect || 1}>
        <BarChart
          width={730}
          height={250}
          data={data}
          onClick={({ activePayload }) => {
            if (activePayload && activePayload[0] && activePayload[0].payload) {
              handleBarClick(activePayload[0].payload as pieChartData);
            }
          }}
        >
          <CartesianGrid strokeDasharray="4" />

          <XAxis
            dataKey="name"
            stroke={theme === "light" ? "black" : "white"}
            height={20}
            tick={(props) => (
              <CustomizedAxisTick
                x={props.x}
                y={props.y}
                payload={props.payload}
                theme={'light'}
              />
            )}
            interval={0} // Show all ticks
          />
          <YAxis
            domain={[0, "dataMax"]}
            allowDecimals={activeDecimal ? true : false}
            stroke={theme === "light" ? "black" : "white"}
          />
          <Tooltip />
          <Legend iconSize={0} />
          <Bar dataKey="value" fill="#8884d8" barSize={200} name={title}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
};

export default DynamicBarChart;
