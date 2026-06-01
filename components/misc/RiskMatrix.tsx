import React, { FC } from "react";

interface RiskMatrixProps {
  onCellClick?: (probability: string, severity: string) => void;
  selectedProbability?: string;
  selectedSeverity?: string;
}

const RiskMatrix: FC<RiskMatrixProps> = ({ onCellClick, selectedProbability, selectedSeverity }) => {
  const severities = [
    { code: "A", name: "Catastrófico" },
    { code: "B", name: "Peligroso" },
    { code: "C", name: "Mayor" },
    { code: "D", name: "Menor" },
    { code: "E", name: "Insignificante" },
  ];
  const probabilities = [
    { value: 5, name: "Frecuente" },
    { value: 4, name: "Ocasional" },
    { value: 3, name: "Remoto" },
    { value: 2, name: "Improbable" },
    { value: 1, name: "Extremadamente Improbable" },
  ];

  const getRiskColor = (severity: string, probability: number): string => {
    const riskCode = `${probability}${severity}`;

    if (["5A", "5B", "5C", "4A", "4B", "3A"].includes(riskCode)) {
      return "bg-red-600";
    } else if (
      [
        "5D",
        "5E",
        "4C",
        "4D",
        "4E",
        "3B",
        "3C",
        "3D",
        "2A",
        "2B",
        "2C",
      ].includes(riskCode)
    ) {
      return "bg-yellow-500";
    } else {
      return "bg-green-600";
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="table-auto border-collapse border border-gray-400 min-w-[340px] text-xs sm:text-sm">
        <thead>
          <tr>
            <th></th>
            <th colSpan={5} className="border border-gray-400 p-1 sm:p-2 text-center">
              Severidad del Riesgo
            </th>
          </tr>
          <tr>
            <th className="border border-gray-400 p-1 sm:p-2 text-center text-xs">
              Probabilidad
            </th>
            {severities.map((severity) => (
              <th
                key={severity.code}
                className="border border-gray-400 p-1 sm:p-2 text-center font-semibold"
              >
                <span className="hidden sm:inline">{severity.name} </span>
                {severity.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {probabilities.map((probability) => (
            <tr key={probability.value}>
              <td className="border border-gray-400 p-1 sm:p-2 text-center font-semibold text-xs">
                <p className="hidden sm:block">{probability.name}</p>
                <p>{probability.value}</p>
              </td>
              {severities.map((severity) => {
                const isSelected =
                  selectedProbability === String(probability.value) &&
                  selectedSeverity === severity.code;
                return (
                  <td
                    key={`${severity.code}-${probability.value}`}
                    onClick={() => onCellClick?.(String(probability.value), severity.code)}
                    className={`border border-gray-400 p-2 sm:p-4 ${getRiskColor(
                      severity.code,
                      probability.value
                    )} text-center ${onCellClick ? "cursor-pointer" : ""} ${isSelected ? "ring-4 ring-inset ring-white font-bold" : ""}`}
                  >
                    {probability.value}
                    {severity.code}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RiskMatrix;
