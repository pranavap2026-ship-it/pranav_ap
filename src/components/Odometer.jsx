/** Mechanical odometer: each digit is a column of 0-9 (twice) that rolls into place. */
export default function Odometer({ value }) {
  return (
    <span className="odo" aria-label={String(value)}>
      {String(value).split('').map((c, i) =>
        /\d/.test(c) ? (
          <span className="odo-win" key={i} aria-hidden="true">
            <span className="odo-col" data-d={c}>{[...Array(20)].map((_, k) => <span key={k}>{k % 10}</span>)}</span>
          </span>
        ) : <span key={i} aria-hidden="true">{c}</span>,
      )}
    </span>
  )
}
