export function AdminState(props: { title: string; message: string }) {
  return (
    <section data-slot="admin-section">
      <div data-slot="section-title">
        <h2>{props.title}</h2>
        <p>{props.message}</p>
      </div>
    </section>
  )
}
