import './PassDevice.css'

type Props = {
  toName: string
  context: string   // e.g. "place your first guess"
  onReady: () => void
}

export function PassDevice({ toName, context, onReady }: Props) {
  return (
    <div className="pass-device">
      <div className="pass-icon">📱</div>
      <p className="pass-title">Pass the device!</p>
      <p className="pass-subtitle">Hand it to</p>
      <p className="pass-name">{toName}</p>
      <p className="pass-subtitle">{context}</p>
      <button className="pass-btn" onClick={onReady}>
        I'm ready
      </button>
    </div>
  )
}
