"use client";

import { useEffect, useMemo } from 'react';

import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAircraftTypes } from '@/hooks/planificacion/useGetAircraftTypes';

import { Plane } from 'lucide-react';

interface AircraftTypeSelectProps {
	value?: number;
	onChange: (value: number | undefined) => void;
	companySlug?: string;
	manufacturerId?: number;
}

export default function AircraftTypeSelect({ value, onChange, companySlug, manufacturerId }: AircraftTypeSelectProps) {
	const { data: aircraftTypes, isLoading: isAircraftTypesLoading, isError: isAircraftTypesError } = useGetAircraftTypes(
		companySlug,
		undefined,
		manufacturerId,
	);

	const types = useMemo(() => aircraftTypes?.data ?? [], [aircraftTypes?.data]);
	const isDisabled = isAircraftTypesLoading || isAircraftTypesError || !manufacturerId;

	useEffect(() => {
		if (value === undefined) return;

		const isValidType = types.some((type) => type.id === value);

		if (!isValidType) {
			onChange(undefined);
		}
	}, [onChange, types, value]);

	return (
		<FormItem className="space-y-2">
			<FormLabel className="mb-4 flex items-center gap-2">
				<Plane className="h-4 w-4" /> Tipo de aeronave
			</FormLabel>
			<Select
				disabled={isDisabled}
				value={typeof value === 'number' ? String(value) : undefined}
				onValueChange={(nextValue) => onChange(Number(nextValue))}
			>
				<FormControl>
					<SelectTrigger>
						<SelectValue
							placeholder={
								manufacturerId ? 'Seleccione el tipo de aeronave...' : 'Seleccione un fabricante primero...'
							}
						/>
					</SelectTrigger>
				</FormControl>
				<SelectContent>
					{types.map((type) => (
						<SelectItem key={type.id} value={String(type.id)}>
							{type.family} · {type.series}
							{type.manufacturer?.name ? ` — ${type.manufacturer.name}` : ''}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<FormMessage />
		</FormItem>
	);
}
