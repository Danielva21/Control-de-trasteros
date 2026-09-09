'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, Clock3, LockKeyhole, RefreshCw, Server, ShieldCheck, Wifi } from 'lucide-react'

type DoorState = 'Cerrada' | 'Abierta'
type Door = { id: number; name: string; state: DoorState; lastUpdate: string; zone: string }

const initialDoors: Door[] = [
  { id: 1, name: 'Puerta 1', state: 'Cerrada', lastUpdate: 'Hace 12 s', zone: 'Almacén A' },
  { id: 2, name: 'Puerta 2', state: 'Cerrada', lastUpdate: 'Hace 18 s', zone: 'Almacén A' },
  { id: 3, name: 'Puerta 3', state: 'Abierta', lastUpdate: 'Hace 4 s', zone: 'Almacén B' },
  { id: 4, name: 'Puerta 4', state: 'Cerrada', lastUpdate: 'Hace 31 s', zone: 'Almacén B' },
  { id: 5, name: 'Puerta 5', state: 'Cerrada', lastUpdate: 'Hace 9 s', zone: 'Carga y descarga' },
  { id: 6, name: 'Puerta 6', state: 'Cerrada', lastUpdate: 'Hace 22 s', zone: 'Carga y descarga' },
]

export default function Page() {
  const [doors, setDoors] = useState(initialDoors)
  const [releasing, setReleasing] = useState<number[]>([])
  const [closing, setClosing] = useState<number[]>([])
  const [lastPoll, setLastPoll] = useState('Ahora mismo')

  const leerEstadoPuertas = useCallback(() => {
    // TODO Node-RED: leer DB_Puertas.puertas[i].Estado desde el flujo conectado.
    setLastPoll('Ahora mismo')
  }, [])

  const liberarCerradura = useCallback((puertaId: number) => {
    setReleasing((current) => [...current, puertaId])
    // TODO Node-RED: escribir DB_Puertas.puertas[i].Salida_Motor = true.
    window.setTimeout(() => {
      setDoors((current) => current.map((door) => door.id === puertaId ? { ...door, state: 'Abierta', lastUpdate: 'Ahora mismo' } : door))
      setReleasing((current) => current.filter((id) => id !== puertaId))
      leerEstadoPuertas()
    }, 4000)
  }, [leerEstadoPuertas])

  const cerrarPuerta = useCallback((puertaId: number) => {
    setClosing((current) => [...current, puertaId])
    // TODO Node-RED: escribir DB_Puertas.puertas[i].Salida_Cierre = true.
    window.setTimeout(() => {
      setDoors((current) => current.map((door) => door.id === puertaId ? { ...door, state: 'Cerrada', lastUpdate: 'Ahora mismo' } : door))
      setClosing((current) => current.filter((id) => id !== puertaId))
      leerEstadoPuertas()
    }, 4000)
  }, [leerEstadoPuertas])

  const cerrarPuertasAbiertas = useCallback(() => {
    doors.filter((door) => door.state === 'Abierta' && !closing.includes(door.id)).forEach((door) => cerrarPuerta(door.id))
  }, [cerrarPuerta, closing, doors])

  useEffect(() => {
    const interval = window.setInterval(leerEstadoPuertas, 10000)
    return () => window.clearInterval(interval)
  }, [leerEstadoPuertas])

  const openCount = useMemo(() => doors.filter((door) => door.state === 'Abierta').length, [doors])
  const lockedCount = doors.length - openCount

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-6 border-b border-border pb-7 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">SCADA / CONTROL LOCAL</p>
                <span className="rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-success">En línea</span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Control de trasteros</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Supervisión y control de cerraduras motorizadas en tiempo real.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground shadow-sm">
            <Wifi className="size-4 text-success" aria-hidden="true" />
            <span>Node-RED conectado</span>
            <span className="h-4 w-px bg-border" />
            <span className="font-mono">MQTT / local</span>
          </div>
        </header>

        <section aria-label="Resumen del sistema" className="grid gap-3 py-7 sm:grid-cols-3">
          <Summary icon={<Server className="size-4" />} label="Total puertas" value={doors.length} detail="Dispositivos configurados" />
          <Summary icon={<ShieldCheck className="size-4" />} label="Cerradas" value={lockedCount} detail="Protección activa" tone="success" />
          <Summary icon={<CircleAlert className="size-4" />} label="Abiertas" value={openCount} detail={openCount ? 'Requieren atención' : 'Todas seguras'} tone={openCount ? 'warning' : 'success'} />
        </section>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Estado de puertas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Selecciona una puerta para liberar su cerradura.</p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <Clock3 className="size-3.5" aria-hidden="true" />
              Última lectura: {lastPoll}
            </div>
            <button type="button" onClick={cerrarPuertasAbiertas} disabled={openCount === 0 || closing.length > 0} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-warning px-4 text-sm font-semibold text-foreground transition hover:bg-warning/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
              <LockKeyhole className="size-4" aria-hidden="true" />
              {closing.length > 0 ? 'Cerrando puertas…' : 'Cerrar puertas abiertas'}
            </button>
          </div>
        </div>

        <section aria-label="Puertas del sistema" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doors.map((door) => <DoorCard key={door.id} door={door} isReleasing={releasing.includes(door.id)} isClosing={closing.includes(door.id)} onRelease={liberarCerradura} onClose={cerrarPuerta} />)}
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono uppercase tracking-[0.15em]">Panel de control v1.0</span>
          <span>Lectura automática cada 10 segundos</span>
        </footer>
      </div>
    </main>
  )
}

function Summary({ icon, label, value, detail, tone = 'default' }: { icon: React.ReactNode; label: string; value: number; detail: string; tone?: 'default' | 'success' | 'warning' }) {
  return <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"><div className={`flex size-9 items-center justify-center rounded-lg ${tone === 'success' ? 'bg-success/10 text-success' : tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>{icon}</div><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p></div><p className="ml-auto hidden text-right text-xs text-muted-foreground sm:block">{detail}</p></div>
}

function DoorCard({ door, isReleasing, isClosing, onRelease, onClose }: { door: Door; isReleasing: boolean; isClosing: boolean; onRelease: (id: number) => void; onClose: (id: number) => void }) {
  const isOpen = door.state === 'Abierta'
  return <article className={`rounded-xl border bg-card p-5 shadow-sm transition-all ${isOpen ? 'border-warning/50' : 'border-border'}`}><div className="flex items-start justify-between"><div><p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{door.zone}</p><h3 className="mt-2 text-xl font-semibold tracking-tight">{door.name}</h3></div><div className={`flex size-11 items-center justify-center rounded-full ${isOpen ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}><LockKeyhole className="size-5" aria-hidden="true" /></div></div><div className="mt-6 flex items-center justify-between border-y border-border py-3"><div className="flex items-center gap-2 text-sm font-medium"><span className={`size-2 rounded-full ${isOpen ? 'bg-warning' : 'bg-success'}`} aria-hidden="true" />{door.state}</div><span className="font-mono text-[11px] text-muted-foreground">{door.lastUpdate}</span></div>{isOpen ? <button type="button" onClick={() => onClose(door.id)} disabled={isClosing} aria-busy={isClosing} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-warning px-4 text-sm font-semibold text-foreground transition hover:bg-warning/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">{isClosing ? <><RefreshCw className="size-4 animate-spin" aria-hidden="true" />Cerrando…</> : <><LockKeyhole className="size-4" aria-hidden="true" />Cerrar puerta</>}</button> : <button type="button" onClick={() => onRelease(door.id)} disabled={isReleasing} aria-busy={isReleasing} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">{isReleasing ? <><RefreshCw className="size-4 animate-spin" aria-hidden="true" />Liberando…</> : 'Liberar cerradura'}</button>}</article>
}
