import { Input } from '@/components/ui/input';

const SearchSection = ({
  searchTerm,
  onSearchChange,
  debouncedSearchTerm,
  showNoResults,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  debouncedSearchTerm: string;
  showNoResults: boolean;
}) => (
  <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto mb-4 space-y-2 mt-4">
    <h3 className="font-bold text-lg">Busqueda General - Nro. de Parte</h3>
    <Input
      placeholder="Búsqueda General - Nro. de Parte (Ej: 65-50582, TORNILLO, ALT-123...)"
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
    />
    {showNoResults && (
      <div className="text-center py-3 text-muted-foreground">
        No se encontraron renglones con artículos que coincidan con: &quot;{searchTerm}&quot;
      </div>
    )}
  </div>
);

export default SearchSection;
