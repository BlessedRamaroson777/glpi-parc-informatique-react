import React from "react"
import { getDashboardData } from "../services/dashboardService.jsx"
import "../styles/dashboard.css"
import { TICKET_STATUS, TICKET_TYPES } from "../../common/constants/Assets.jsx"


function SectionTitle({ children }) {
    return <p className="section-title">{children}</p>
}

function Row({ label, value, accent }) {
    return (
        <li className="dashboard-row">
            <span className="dashboard-row-label">{label}</span>
            <span className={accent ? "dashboard-row-value accent" : "dashboard-row-value"}>
                {value}
            </span>
        </li>
    )
}

function Block({ title, total, children }) {
    return (
        <div className="dashboard-block">
            <div className="dashboard-block-header">
                <h2 className="dashboard-block-title">{title}</h2>

                <span className="dashboard-total-badge">
                    {total} au total
                </span>
            </div>

            <ul className="dashboard-list">
                {children}
            </ul>
        </div>
    )
}

export default function Dashboard() {
    const [data, setData] = React.useState(null)
    const [error, setError] = React.useState(null)

    React.useEffect(() => {
        getDashboardData()
            .then(setData)
            .catch(e => setError(e.message))
    }, [])

    if (error) {
        return (
            <section className="dashboard-container">
                <p className="dashboard-error">
                    Erreur : {error}
                </p>
            </section>
        )
    }

    if (!data) {
        return (
            <section className="dashboard-container">
                <p className="dashboard-loading">
                    Chargement…
                </p>
            </section>
        )
    }

    const { assets, tickets } = data

    return (
        <section className="dashboard-container">
            <h1 className="dashboard-title">Dashboard</h1>

            <Block title="Éléments" total={assets.total}>
                {assets.byType
                    // .filter(a => a.count > 0)
                    .map(a => (
                        <Row
                            key={a.key}
                            label={a.label}
                            value={a.count}
                        />
                    ))}

                {assets.byType.every(a => a.count === 0) && (
                    <li className="dashboard-empty">
                        Aucun élément trouvé.
                    </li>
                )}
            </Block>

            <Block title="Tickets" total={tickets?.total ?? 0}>
                <SectionTitle>Par type</SectionTitle>

                {TICKET_TYPES.map(({ key, label }) => (
                    <Row
                        key={key}
                        label={label}
                        value={tickets?.by_type?.[key] ?? 0}
                    />
                ))}

                <div className="dashboard-spacing">
                    <SectionTitle>Par statut</SectionTitle>
                </div>

                {TICKET_STATUS.map(({ key, label }) => (
                    <Row
                        key={key}
                        label={label}
                        value={tickets?.by_status?.[key] ?? 0}
                    />
                ))}
            </Block>
        </section>
    )
}