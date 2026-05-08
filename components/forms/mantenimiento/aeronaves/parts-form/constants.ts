import { Control, useWatch } from "react-hook-form";

export const PART_TYPES = [
	"Motor",
	"Helice",
	"Tren de Aterrizaje Principal",
	"Tren de Aterrizaje de la Nariz",
];

export const POSITION_TYPES = [
	{ label: "Left Hand (LH)", value: "LH" },
	{ label: "Right Hand (RH)", value: "RH" },
];

export const usePartValue = <T,>(control: Control<any>, path: string, defaultValue?: T): T => {
	return useWatch({
		control,
		name: path as any,
		defaultValue,
	}) as unknown as T;
};
