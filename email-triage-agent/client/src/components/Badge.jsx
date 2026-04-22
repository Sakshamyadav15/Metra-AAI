const badgeStyle = {
  Urgent: "bg-red-100 text-red-700 border-red-300",
  Routine: "bg-amber-100 text-amber-700 border-amber-300",
  FYI: "bg-sky-100 text-sky-700 border-sky-300",
  Spam: "bg-zinc-200 text-zinc-700 border-zinc-300",
};

export default function Badge({ category }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${badgeStyle[category] || badgeStyle.FYI}`}
    >
      {category}
    </span>
  );
}
