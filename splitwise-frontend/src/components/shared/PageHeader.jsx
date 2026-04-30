export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      ) : null}
    </div>
    {action ? <div className="flex-shrink-0">{action}</div> : null}
  </div>
);
