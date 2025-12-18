import { DispatchArticle } from './page';

export function DispatchArticlesInline({ articles }: { articles: DispatchArticle[] }) {
  return (
    <div className="border-t">
      <div className="p-3">
        <div className="rounded-md border bg-background">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-muted-foreground">
            <div className="col-span-3">Part Number</div>
            <div className="col-span-5">Descripción</div>
            <div className="col-span-2 text-center">Cantidad</div>
            <div className="col-span-2 text-center">Serial</div>
          </div>

          <div className="divide-y">
            {articles.map((a) => (
              <div key={a.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm">
                <div className="col-span-3 font-medium">{a.part_number}</div>
                <div className="col-span-5 text-muted-foreground">{a.batch ?? a.description ?? '—'}</div>
                <div className="col-span-2 text-center font-medium">{a.dispatch_quantity}</div>
                <div className="col-span-2 text-center text-muted-foreground">{a.serial ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
