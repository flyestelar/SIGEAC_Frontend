import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

type TagsInputProps = {
  value: string[] | null | undefined;
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
};

const TagsInput: React.FC<TagsInputProps> = ({ value, onChange, placeholder, className }) => {
  const [input, setInput] = useState('');

  const trimmed = input.trim();
  const isDuplicate = useMemo(
    () => !!trimmed && value?.some((p) => p.toLowerCase() === trimmed.toLowerCase()),
    [trimmed, value],
  );

  const canAdd = trimmed.length > 0 && !isDuplicate;

  const add = () => {
    if (!canAdd) return;
    onChange([...(value ?? []), trimmed]);
    setInput('');
  };

  const remove = (part: string) => onChange((value ?? []).filter((v) => v !== part));

  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add();
                }
              }}
            />
          </div>
          <Button type="button" variant="secondary" className="whitespace-nowrap" disabled={!canAdd} onClick={add}>
            Agregar
          </Button>
        </div>
        {isDuplicate && <p className="text-xs text-amber-200">Ya agregaste ese número de parte.</p>}
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {value?.length ? (
          value.map((part) => (
            <Badge
              key={part}
              variant="outline"
              className="flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-3 py-1 text-xs font-semibold text-white"
            >
              <span className="truncate">{part}</span>
              <button
                type="button"
                aria-label={`Quitar número de parte ${part}`}
                onClick={() => remove(part)}
                className="rounded-full bg-white/10 p-0.5 text-white transition hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">Agrega números de parte para expandir el alcance.</p>
        )}
      </div>
    </div>
  );
};

export default TagsInput;
