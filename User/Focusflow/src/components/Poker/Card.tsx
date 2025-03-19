import { clsx } from "clsx";

interface CardProps {
  value: string;
  selected?: boolean;
  onClick?: () => void;
}

export function Card({ value, selected, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full aspect-[3/4] rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-2xl",
        "flex items-center justify-center text-3xl font-bold",
        selected
          ? "bg-red-500/20 text-red-400 border-2 border-red-500"
          : "bg-gray-800 text-gray-300 border border-gray-600 hover:border-red-500/70 hover:bg-red-500/10",
        !selected && "hover:shadow-red-500/30"
      )}
    >
      {value}
    </button>
  );
}
