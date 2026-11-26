import { TelaCarregando } from "@/components/ui/TelaCarregando";

/** Carregamento entre telas (jogos, álbum, cartas...): a Juju voando. */
export default function Loading() {
  return (
    <div className="relative min-h-dvh">
      <TelaCarregando />
    </div>
  );
}
