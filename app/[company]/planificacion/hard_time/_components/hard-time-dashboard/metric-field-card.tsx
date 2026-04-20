import { TimerReset } from 'lucide-react';
import { Input } from '@/components/ui/input';

type MetricFieldCardProps = {
  icon: typeof TimerReset;
  title: string;
  unit: string;
  hint: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
};

export function MetricFieldCard({ icon: Icon, title, unit, hint, value, step, onChange }: MetricFieldCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3">
      <div className="mb-3 flex items-start gap-2">
        <div className="rounded-md border border-border/60 bg-muted/30 p-1.5">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="flex items-center rounded-lg border border-border/60 bg-muted/10 px-3">
        <Input
          type="number"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          placeholder="0"
        />
        <span className="ml-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
