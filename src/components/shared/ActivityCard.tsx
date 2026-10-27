import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import Icon from "@/components/ui/Icon";
import { formatCOP } from "@/lib/booking/pricing";
import type { Activity } from "@/types";

export default function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-ink text-white">
      <Link href={`/actividades/${activity.slug}`} className="relative block aspect-[4/3] overflow-hidden">
        <SmartImage
          src={activity.image || "/images/act-senderismo.jpg"}
          alt={activity.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-[1.3s] ease-luxe group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
        <span className="badge absolute left-4 top-4 bg-lime-400 text-ink">{activity.category}</span>
        <span className="badge absolute right-4 top-4 bg-ink/60 text-white backdrop-blur">{activity.difficulty}</span>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl uppercase leading-none">{activity.name}</h3>
          <div className="mt-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/60">
            <span className="flex items-center gap-1"><Icon name="clock" className="h-3 w-3" /> {activity.duration}</span>
            <span className="flex items-center gap-1"><Icon name="users" className="h-3 w-3" /> desde {activity.minAge} años</span>
          </div>
        </div>
      </Link>
      <div className="p-5">
        <p className="line-clamp-2 text-sm leading-6 text-white/55">{activity.shortDescription}</p>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <span className="font-display text-xl text-lime-400">{formatCOP(activity.price)}</span>
            <span className="ml-1 text-[10px] uppercase tracking-wider text-white/40">/ {activity.priceUnit}</span>
          </div>
          <Link href={`/actividades/${activity.slug}`} className="link-arrow !text-lime-400 hover:!text-white">
            Ver más <Icon name="arrow-up" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
