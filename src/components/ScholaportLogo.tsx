import logo from "@/assets/scholaport-logo.png";
import { cn } from "@/lib/utils";

export function ScholaportLogo({
  className,
  showWordmark = false,
  inverse = false,
}: {
  className?: string;
  showWordmark?: boolean;
  inverse?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative aspect-square h-full shrink-0 overflow-hidden rounded-[24%] bg-white">
        <img
          src={logo}
          alt="Scholaport"
          className="absolute inset-0 h-full w-full scale-[1.62] object-cover"
        />
      </span>
      {showWordmark && (
        <span
          className={cn(
            "font-display text-xl font-bold tracking-[-0.04em]",
            inverse ? "text-white" : "text-[#0A175A]",
          )}
        >
          Scholaport
        </span>
      )}
    </span>
  );
}
