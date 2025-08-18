"use client";

import { COLORS } from "@/lib/utils";
import { pieChartData, ReportsByArea } from "@/types";
import { Tooltip } from "@radix-ui/react-tooltip";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

// Función para truncar a 2 decimales sin redondear
const formatPercent = (percent: number) => {
  const fixed = Math.floor(percent * 10000) / 100; // Multiplicamos por 10000, truncamos y dividimos entre 100
  return fixed.toFixed(2); // Aseguramos 2 decimales (puede terminar en .00)
};

interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  payload: ReportsByArea;
}

const RADIAN = Math.PI / 180;

interface PieChartComponentProps {
  data: pieChartData[];
  title?: string;
  height?: string;
  width?: string;
  radius: number;
}

const PieChartComponent = ({
  data,
  title,
  height,
  width,
  radius,
}: PieChartComponentProps) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const { theme } = useTheme();

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    payload,
  }: CustomizedLabelProps) => {
    const radius = outerRadius * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={theme === "light" ? "black" : "white"}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="bottom"
        fontSize="20px"
        fontFamily="Arial"
      >
        <tspan x={x} dy="-1em">{`${formatPercent(percent)}%`}</tspan>
        <tspan x={x} dy="1em">{`${payload.name}`}</tspan>
      </text>
    );
  };

  const onPieEnter = (_: void, index: number) => {
    setActiveIndex(index);
  };

  return (
    <>
      <h1 className="text-sm font-semibold">{title}</h1>
      <ResponsiveContainer aspect={1}>
        <PieChart width={400} height={400}>
          {data ? (
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={renderCustomizedLabel}
              outerRadius={radius}
              fill="#8884d8"
              dataKey="value"
              activeIndex={activeIndex}
              onMouseEnter={onPieEnter}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
              <Tooltip />
            </Pie>
          ) : (
            <p>No hay datos para mostrar..</p>
          )}
        </PieChart>
      </ResponsiveContainer>
    </>
  );
};

export default PieChartComponent;
